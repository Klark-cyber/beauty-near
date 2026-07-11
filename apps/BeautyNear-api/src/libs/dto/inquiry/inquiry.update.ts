import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import * as mongoose from 'mongoose';
import { InquiryStatus } from '../../enums/inquiry.enum';

// Faqat ADMIN javob berish/status o'zgartirish uchun ishlatadi
@InputType()
export class InquiryUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => InquiryStatus, { nullable: true })
	inquiryStatus?: InquiryStatus;

	@IsOptional()
	@Length(1, 2000)
	@Field(() => String, { nullable: true })
	inquiryReply?: string;
}
