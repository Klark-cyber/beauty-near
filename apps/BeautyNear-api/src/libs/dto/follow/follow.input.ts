import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import * as mongoose from 'mongoose';

@InputType()
class FollowSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	followingId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	followerId?: mongoose.ObjectId;

	// SALON follow uchun
	@IsOptional()
	@Field(() => String, { nullable: true })
	salonId?: mongoose.ObjectId;

	// SERVICE follow uchun
	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceId?: mongoose.ObjectId;
}

@InputType()
export class FollowInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsNotEmpty()
	@Field(() => FollowSearch)
	search: FollowSearch;
}

// subscribe / unsubscribe uchun alohida input
@InputType()
export class FollowToggleInput {
	// MEMBER follow: followingId
	@IsOptional()
	@Field(() => String, { nullable: true })
	followingId?: mongoose.ObjectId;

	// SALON follow: salonId
	@IsOptional()
	@Field(() => String, { nullable: true })
	salonId?: mongoose.ObjectId;

	// SERVICE follow: serviceId
	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceId?: mongoose.ObjectId;
}