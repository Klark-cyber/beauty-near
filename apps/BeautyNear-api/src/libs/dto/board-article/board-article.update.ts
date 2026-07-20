import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { BoardArticleStatus } from '../../enums/board-article.enum';
import * as mongoose from 'mongoose';

@InputType()
export class BoardArticleUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => BoardArticleStatus, { nullable: true })
	articleStatus?: BoardArticleStatus;

	@IsOptional()
	@Length(3, 50)
	@Field(() => String, { nullable: true })
	articleTitle?: string;

	// ⚠️ TUZATILDI: xuddi shu 250 belgi cheklovi bu yerda ham bor edi
	@IsOptional()
	@Length(3, 5000)
	@Field(() => String, { nullable: true })
	articleContent?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleImage?: string;
}