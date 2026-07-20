import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like'; // ⚠️ YANGI

@ObjectType()
export class Comment {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => CommentStatus) // TYPO TUZATILDI: Nestar da "ç" belgisi bor edi
	commentStatus: CommentStatus;

	@Field(() => CommentGroup)
	commentGroup: CommentGroup;

	@Field(() => String)
	commentContent: string;

	// ⚠️ YANGI — eski (rating qo'shilishidan oldingi) yozuvlarda bu
	// maydon bo'lmasligi mumkin, shuning uchun nullable
	@Field(() => Int, { nullable: true })
	commentRating?: number;

	// ⚠️ YANGI
	@Field(() => Int, { nullable: true })
	commentLikes?: number;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => String)
	commentRefId: mongoose.ObjectId;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/
	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Comments {
	@Field(() => [Comment])
	list: Comment[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}