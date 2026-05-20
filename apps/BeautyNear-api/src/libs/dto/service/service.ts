import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { ServiceStatus, ServiceType } from '../../enums/service.enum';
import { Member, TotalCounter } from '../member/member';
import { Salon } from '../salon/salon';
import { MeLiked } from '../like/like';

@ObjectType()
export class Service {
    @Field(() => String)
    _id: mongoose.Types.ObjectId;

    @Field(() => ServiceType)
    serviceType: ServiceType;

    @Field(() => ServiceStatus)
    serviceStatus: ServiceStatus;

    @Field(() => String)
    serviceTitle: string;

    @Field(() => String, { nullable: true })
    serviceDesc?: string;

    @Field(() => Int)
    servicePrice: number;

    @Field(() => Int)
    serviceDuration: number;

    @Field(() => [String], { nullable: true })
    serviceImages?: string[];

    @Field(() => Int)
    serviceViews: number;

    @Field(() => Int)
    serviceLikes: number;

    @Field(() => Int)
    serviceComments: number;

    @Field(() => Int)
    serviceRank: number;

    @Field(() => Number)
    serviceRating: number;

    @Field(() => String)
    salonId: mongoose.ObjectId;

    @Field(() => String)
    memberId: mongoose.ObjectId;

    @Field(() => Date, { nullable: true })
    deletedAt?: Date;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    /** from aggregation **/
    @Field(() => Member, { nullable: true })
    memberData?: Member; // master ma'lumotlari

    @Field(() => Salon, { nullable: true })
    salonData?: Salon; // salon ma'lumotlari

    @Field(() => [MeLiked], { nullable: true })
    meLiked?: MeLiked[];
}

@ObjectType()
export class Services {
    @Field(() => [Service])
    list: Service[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}