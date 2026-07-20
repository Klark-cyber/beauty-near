import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { SalonLocation, SalonStatus, SalonType } from '../../enums/salon.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';
import { MeFollowed } from '../follow/follow';

@ObjectType()
export class Salon {
    @Field(() => String)
    _id: mongoose.Types.ObjectId;

    @Field(() => SalonType)
    salonType: SalonType;

    @Field(() => SalonStatus)
    salonStatus: SalonStatus;

    @Field(() => SalonLocation)
    salonLocation: SalonLocation;

    @Field(() => String)
    salonAddress: string;

    @Field(() => String)
    salonTitle: string;

    @Field(() => String, { nullable: true })
    salonDesc?: string;

    @Field(() => [String])
    salonImages: string[];

    @Field(() => String)
    salonPhone: string;

    @Field(() => String)
    salonWorkHours: string;

    @Field(() => String, { nullable: true })
    salonInstagram?: string;

    @Field(() => Int)
    salonViews: number;

    @Field(() => Int)
    salonLikes: number;

    @Field(() => Int)
    salonComments: number;

    // ⚠️ YANGI
    @Field(() => Number, { nullable: true })
    salonRating?: number;

    @Field(() => Int)
    salonRank: number;

    @Field(() => Int)
    salonFollowers: number;

    @Field(() => Int)
    depositAmount: number;

    // Geo lokatsiya
    @Field(() => Number, { nullable: true })
    salonLatitude?: number;

    @Field(() => Number, { nullable: true })
    salonLongitude?: number;

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
    memberData?: Member;

    @Field(() => [MeLiked], { nullable: true })
    meLiked?: MeLiked[];

    @Field(() => [MeFollowed], { nullable: true })
    meFollowed?: MeFollowed[];
}

@ObjectType()
export class Salons {
    @Field(() => [Salon])
    list: Salon[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}