import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { AgentRequestStatus, MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { MeLiked } from '../like/like';
import { MeFollowed } from '../follow/follow';

@ObjectType()
export class Member {
  @Field(() => String)
  _id: mongoose.Types.ObjectId;

  @Field(() => MemberType)
  memberType: MemberType;

  @Field(() => MemberStatus)
  memberStatus: MemberStatus;

  // ⚠️ YANGI
  @Field(() => AgentRequestStatus, { nullable: true })
  agentRequestStatus?: AgentRequestStatus;

  @Field(() => MemberAuthType)
  memberAuthType: MemberAuthType;

  @Field(() => String)
  memberPhone: string;

  @Field(() => String)
  memberNick: string;

  memberPassword?: string;

  @Field(() => String, { nullable: true })
  memberFullName?: string;

  @Field(() => String)
  memberImage: string;

  // Agent uchun qo'shimcha portfolio rasmlari
  @Field(() => [String], { nullable: true })
  memberPortfolio?: string[];

  @Field(() => String, { nullable: true })
  memberAddress?: string;

  @Field(() => String, { nullable: true })
  memberDesc?: string;

  // Agent uchun: yillik tajriba
  @Field(() => Int, { nullable: true })
  memberExperience?: number;

  // Agent uchun: mutaxassislik sohalari
  @Field(() => [String], { nullable: true })
  memberSpecialty?: string[];

  // NESTAR: memberProperties → BEAUTYNEAR: memberSalons
  @Field(() => Int)
  memberSalons: number;

  @Field(() => Int)
  memberArticles: number;

  @Field(() => Int)
  memberFollowers: number;

  @Field(() => Int)
  memberFollowings: number;

  @Field(() => Int, { nullable: true })
  memberPoints?: number;

  @Field(() => Int)
  memberLikes: number;

  @Field(() => Int)
  memberViews: number;

  @Field(() => Int)
  memberComments: number;

  @Field(() => Int)
  memberRank: number;

  @Field(() => Int)
  memberWarnings: number;

  @Field(() => Int)
  memberBlocks: number;

  // Geo lokatsiya — user yaqin salonlarni topishi uchun
  @Field(() => Number, { nullable: true })
  memberLatitude?: number;

  @Field(() => Number, { nullable: true })
  memberLongitude?: number;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  accessToken?: string;

  /** from aggregation **/
  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];

  @Field(() => [MeFollowed], { nullable: true })
  meFollowed?: MeFollowed[];
}

@ObjectType()
export class TotalCounter {
  @Field(() => Int, { nullable: true })
  total: number;
}

@ObjectType()
export class Members {
  @Field(() => [Member])
  list?: Member[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}