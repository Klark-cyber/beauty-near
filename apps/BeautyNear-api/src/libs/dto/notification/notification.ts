import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { NotificationType, NotificationStatus, NotificationGroup } from '../../enums/notification.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Notification {
    @Field(() => String)
    _id: mongoose.ObjectId;

    @Field(() => NotificationType)
    notificationType: NotificationType;

    @Field(() => NotificationStatus)
    notificationStatus: NotificationStatus;

    @Field(() => NotificationGroup)
    notificationGroup: NotificationGroup;

    @Field(() => String)
    notificationTitle: string;

    @Field(() => String, { nullable: true })
    notificationDesc?: string;

    @Field(() => String, { nullable: true })
    authorId?: mongoose.ObjectId;

    // ⚠️ YANGI — kim like/follow qilgani (ism, rasm) ko'rsatish uchun
    @Field(() => Member, { nullable: true })
    authorData?: Member;

    @Field(() => String)
    receiverId: mongoose.ObjectId;

    @Field(() => String, { nullable: true })
    salonId?: mongoose.ObjectId;

    @Field(() => String, { nullable: true })
    articleId?: mongoose.ObjectId;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}

@ObjectType()
export class Notifications {
    @Field(() => [Notification])
    list: Notification[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}