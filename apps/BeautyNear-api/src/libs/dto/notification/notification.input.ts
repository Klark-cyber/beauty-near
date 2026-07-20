import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { NotificationStatus } from '../../enums/notification.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
class NTISearch {
	@IsOptional()
	@Field(() => NotificationStatus, { nullable: true })
	notificationStatus?: NotificationStatus;
}

@InputType()
export class NotificationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => NTISearch)
	search: NTISearch;
}