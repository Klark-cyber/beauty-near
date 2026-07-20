import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { NotificationService } from './notification.service';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class NotificationResolver {
    constructor(private readonly notificationService: NotificationService) { }

    @UseGuards(AuthGuard)
    @Query(() => Notifications)
    public async getNotifications(
        @Args('input') input: NotificationsInquiry,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Notifications> {
        console.log('Query: getNotifications');
        return await this.notificationService.getNotifications(memberId, input);
    }

    // ⚠️ Qo'ng'iroqcha ustidagi qizil badge uchun — engil, tez so'rov
    @UseGuards(AuthGuard)
    @Query(() => Int)
    public async getUnreadNotificationCount(@AuthMember('_id') memberId: mongoose.ObjectId): Promise<number> {
        console.log('Query: getUnreadNotificationCount');
        return await this.notificationService.getUnreadCount(memberId);
    }

    @UseGuards(AuthGuard)
    @Mutation(() => Notification)
    public async markNotificationAsRead(
        @Args('notificationId') input: string,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Notification> {
        console.log('Mutation: markNotificationAsRead');
        const notificationId = shapeIntoMongoObjectId(input);
        return await this.notificationService.markAsRead(memberId, notificationId);
    }

    @UseGuards(AuthGuard)
    @Mutation(() => Boolean)
    public async markAllNotificationsAsRead(@AuthMember('_id') memberId: mongoose.ObjectId): Promise<boolean> {
        console.log('Mutation: markAllNotificationsAsRead');
        return await this.notificationService.markAllAsRead(memberId);
    }
}