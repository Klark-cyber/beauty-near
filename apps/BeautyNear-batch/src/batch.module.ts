import { Module } from '@nestjs/common';
import { BatchController as BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { ConfigModule } from "@nestjs/config"; //.env ichidagilarni import qilish imkonini beruvchi package
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import PropertySchema from 'apps/BeautyNear-api/src/schemas/Service.model';
import MemberSchema from 'apps/BeautyNear-api/src/schemas/Member.model';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([{ name: 'Property', schema: PropertySchema }]),
    MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
  ],
  controllers: [BatchController],
  providers: [BatchService],
})
export class BatchModule { }


