import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import * as mongoose from 'mongoose';
import { FaqCategory, FaqStatus } from '../../enums/faq.enum';

@InputType()
export class FaqUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => FaqCategory, { nullable: true })
	faqCategory?: FaqCategory;

	@IsOptional()
	@Field(() => FaqStatus, { nullable: true })
	faqStatus?: FaqStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	faqQuestion?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	faqAnswer?: string;
}
