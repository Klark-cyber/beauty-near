import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InquiryResolver } from './inquiry.resolver';
import { InquiryService } from './inquiry.service';
import InquirySchema from '../../schemas/Inquiry.model';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../../socket/socket.module'; // ⚠️ YANGI

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Inquiry', schema: InquirySchema }]),
		AuthModule,
		SocketModule,
	],
	providers: [InquiryResolver, InquiryService],
})
export class InquiryModule { }