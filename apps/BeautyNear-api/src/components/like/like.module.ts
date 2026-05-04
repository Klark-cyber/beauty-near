import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import LikeSchema from '../../schemas/Like.model';
import { LikeService } from './like.service';

@Module({
    imports: [
    MongooseModule.forFeature([{ name: "Like", schema: LikeSchema }]),
  ],
    providers: [LikeService], //like moduleda resolver va schema mavjud bolmaydi. like matigi tegishli member yoki property resolver ichida LikeServicening kerakli methodini chaqirgan holda ishlatiladi
    exports: [LikeService]
})
export class LikeModule {}
