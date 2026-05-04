import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import {graphqlUploadExpress} from "graphql-upload" //serverga klayotgan file hajmiga limit qoyish uchun kerak
import * as express from 'express';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()) //=> pipelarni global tarzda ornatamiz.
  app.useGlobalInterceptors(new LoggingInterceptor()) //=> Logging interceptorni hosil qildik natijada terminalda re/res haqida bazi malumotlarga ega bolamiz
  app.enableCors({origin:true, credentials:true}) //Cors integratsiyasini amalga oshirdik frontenddan yuborilgan file yoki rasmni qabul qilish uchun
  app.use(graphqlUploadExpress({maxFileSize: 150000000, maxFiles: 10}));
  app.use("/uploads", express.static('./uploads')) //uploads folderni static qildik
  app.useWebSocketAdapter(new WsAdapter(app))
  
  await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
