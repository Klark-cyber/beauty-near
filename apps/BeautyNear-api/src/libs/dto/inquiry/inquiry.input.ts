import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { InquiryStatus } from '../../enums/inquiry.enum';
import { Direction } from '../../enums/common.enum';
import { availableInquirySorts } from '../../config';

@InputType()
export class InquiryInput {
	@IsNotEmpty()
	@Field(() => String)
	inquirySubject: string;

	@IsNotEmpty()
	@Field(() => String)
	inquiryMessage: string;

	memberId?: mongoose.ObjectId; // AuthMember dekoratori orqali qo'shiladi
}

// Foydalanuvchi — faqat o'zining murojaatlari
@InputType()
class MyISearch {
	@IsOptional()
	@Field(() => InquiryStatus, { nullable: true })
	inquiryStatus?: InquiryStatus;
}

@InputType()
export class MyInquiriesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableInquirySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => MyISearch)
	search: MyISearch;
}

// Admin — barcha murojaatlar
@InputType()
class AISearch {
	@IsOptional()
	@Field(() => InquiryStatus, { nullable: true })
	inquiryStatus?: InquiryStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AllInquiriesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableInquirySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AISearch)
	search: AISearch;
}
