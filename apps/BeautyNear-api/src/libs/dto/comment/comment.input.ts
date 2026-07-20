import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { CommentGroup } from '../../enums/comment.enum';
import { Direction } from '../../enums/common.enum';
import { availableCommentSorts } from '../../config';

@InputType()
export class CommentInput {
	@IsNotEmpty()
	@Field(() => CommentGroup)
	commentGroup: CommentGroup;

	@IsNotEmpty()
	@Length(1, 100)
	@Field(() => String)
	commentContent: string;

	@IsNotEmpty()
	@Field(() => String)
	commentRefId: mongoose.ObjectId;

	// ⚠️ YANGI — 1 dan 5 gacha baho
	@IsOptional()
	@Field(() => Int, { nullable: true })
	commentRating?: number;

	memberId?: mongoose.ObjectId;
}

@InputType()
class CISearch {
	@IsNotEmpty()
	@Field(() => String)
	commentRefId: mongoose.ObjectId;

	// ⚠️ YANGI — guruh bo'yicha filtrlash (SALON/SERVICE/ARTICLE)
	@IsOptional()
	@Field(() => CommentGroup, { nullable: true })
	commentGroup?: CommentGroup;
}

@InputType()
export class CommentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableCommentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => CISearch)
	search: CISearch;
}