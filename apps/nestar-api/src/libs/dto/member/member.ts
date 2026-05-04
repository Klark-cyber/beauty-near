import { Field, Int, ObjectType } from "@nestjs/graphql";
import * as mongoose from "mongoose";
import { MemberAuthType, MemberStatus, MemberType } from "../../enums/member.enum";
import { MeLiked } from "../like/like";
import { MeFollowed } from "../follow/follow";


// Backend => Frontend types @ObjectType() orqali hosil qilinadi
@ObjectType()
export class Member{
    @Field(() => String) //Field bu return boladigan resultni typeni tekshirib beradi
    _id: mongoose.Types.ObjectId;

    @Field(() => MemberType)
    memberType: MemberType;

    @Field(() => MemberStatus)
    memberStatus: MemberStatus;

    @Field(() => MemberAuthType)
    memberAuthType: MemberAuthType;

    @Field(() => String)
    memberPhone: string;

    @Field(() => String)
    memberNick: string;

    memberPassword?: string; //Field yozilmaganiga sabab password tashqi olamga ochiqlanmaydi
    
    @Field(() => String, {nullable: true}) //memberFullName optional boladi
    memberFullName?: string;
    
    @Field(() => String) 
    memberImage: string;

     @Field(() => String, {nullable: true}) 
    memberAddress?: string;

     @Field(() => String, {nullable: true}) 
    memberDesc?: string;

    @Field(() => Int)
    memberProperties: number;

     @Field(() => Int)
    memberArticles: number;

    @Field(() => Int)
    memberFollowers: number;

     @Field(() => Int)
    memberFollowings: number;

     @Field(() => Int, {nullable: true})  
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

     @Field(() => Date, {nullable: true}) 
    deletedAt?: Date;

    @Field(() => Date ) 
    createdAt: Date; 

    @Field(() => Date ) 
    updatedAt: Date;

    @Field(() => String, {nullable: true} ) //jwt orqali hosil bolgan tokenni responsda graphql orqali browserga yuboramiz
    accessToken?: string;

    /** from aggregation  */
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

  @Field(() => [TotalCounter], {nullable: true})
  metaCounter: TotalCounter[];
}