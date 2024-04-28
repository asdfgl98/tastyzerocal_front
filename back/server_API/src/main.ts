import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
    origin: [process.env.FRONT_ORIGIN, process.env.DOMAIN_NAME] , 
    credentials: true}
  });
  await app.listen(process.env.PORT);
}
bootstrap();
