import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Review } from './schema/review.schema';
import { Model } from 'mongoose';
import { CreateReviewDTO } from './dto/create-review.dto';
import { WriteCommentDTO } from './dto/write-comment.dto';
import {v4 as uuid} from 'uuid'
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectModel(Review.name) private readonly ReviewModel: Model<Review>,
        private readonly usersService: UsersService
    ){}

    /**리뷰 생성 Model */
    async createReview(createReview: CreateReviewDTO, s3ImageUrl:string[], _id: string){
        const data = {...createReview, image:s3ImageUrl, createBy: _id}

        const result = await this.ReviewModel.create(data)
        if(!result){
            throw new BadRequestException("createReview : Review 생성 오류")
        }
        
        return result
    }

    /**모든 리뷰 조회 Model*/
    async getAllReviewData (){
        const result = await this.ReviewModel.find({},{
            comments: false,
            updatedAt: false,
        }).populate('createBy', "createBy name id").sort({createdAt: -1}) // 내림차순 정렬(최신순)
        
        if(!result){
            throw new BadRequestException("getReviewData : Review 데이터 조회 오류")
        }
        return result
    }

    async deleteReview(postId: string, userId: string){
        const find = await this.ReviewModel.findById(postId).populate('createBy')
        if(!find){
            throw new BadRequestException("존재하지 않는 리뷰입니다.")
        }
        const findId: any = find.createBy.id
        if(findId !== userId){
            throw new BadRequestException("deleteReview : 삭제 권한이 부여되지 않았습니다. 작성자 본인인지 확인해주세요")
        }

        const result = await this.ReviewModel.findByIdAndDelete(postId).catch((err)=>{
            throw new BadRequestException("deleteReview : 리뷰 삭제중 오류가 발생했습니다.")
        })

        return find.image

        
    }



    async getComments (postId: string){
        const result = await this.ReviewModel.findById(postId,{
            category: false,
            content: false,
            createBy: false,
            createdAt: false,
            image: false,
            imgUrl: false,
            store: false,
            tag: false,
            title: false,
            updatedAt: false
        })
        if(!result){
            throw new BadRequestException('getComments : 리뷰 불러오기 쿼리 오류 발생')
        }

        return result.comments
    }

    async writeComment(commentData: WriteCommentDTO, user: any){
        const {comments} = await this.ReviewModel.findByIdAndUpdate(
            commentData.postId,
            {$push: {comments: {
                commentId: uuid(),
                postId: commentData.postId,
                userId: user.id,
                userName: user.name,
                comment: commentData.comment
            }}},
            {new: true}
          )
        return comments
    }

    async deleteComment(commentId: string, postId: string){
        const find = await this.ReviewModel.findById(postId)
        if(!find){
            throw new BadRequestException("deleteComment : 존재하지 않는 리뷰입니다.")
        }

        const filterComment = find.comments.filter((item)=>item.commentId !== commentId)

        const updateComments = await this.ReviewModel.findByIdAndUpdate(
            postId,
            {comments: filterComment},
            {new: true}
        )
        if(!updateComments){
            throw new BadRequestException("deleteComment : 댓글 삭제 중 오류가 발생했습니다." )
        }

        return updateComments.comments
    }

    async viewCount(postId: string){
        const result = await this.ReviewModel.findByIdAndUpdate(
            postId,
            {$inc: { viewCount: 1}},{new: true}
        ).catch((err)=>{
            throw new BadRequestException("viewCount 조회수 증가 쿼리 에러")
        })
    }

    async likeCount(postId: string, userId: string, isMyPage: boolean){
        let find = await this.ReviewModel.findById(postId)
        const include = find.likeCount.includes(userId)
        this.usersService.likeListUpdate(include, userId, postId)
        let result: any;
        if (include){
            result = await this.ReviewModel.findByIdAndUpdate(
                postId,
                {$pull: {likeCount : userId}}
            )
        }
        else{
            result = await this.ReviewModel.findByIdAndUpdate(
                postId,
                {$push: { likeCount: userId}}
            )
        }

        if(!result){
            throw new BadRequestException("likeCount : 좋아요 쿼리 에러")
        }

        if(isMyPage){
            return await this.usersService.getMyPageData(userId)

        }
        return await this.getAllReviewData()
    }
}
