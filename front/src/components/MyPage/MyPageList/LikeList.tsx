import React, { useEffect } from 'react'
import "./myPageList.css"
import { userDataList } from '../../../model/types'
import ReviewCard from '../../ReviewPage/ReviewCard'

interface OwnProp {
  userDataList: userDataList
  setUserDataList(data: any): void
}

const LikeList:React.FC<OwnProp> = ({userDataList, setUserDataList}) => {

  return (
    <div className='mypage-list-container'>
      <div className='mypage-list-card-box'>
        {userDataList.likeList?.map((item, index)=>(
                    <ReviewCard key={index} data={item} reviewData={userDataList.likeList} setReviewData={setUserDataList} isMyPage={true}/>
                ))}
      </div>
    </div>
  )
}

export default LikeList