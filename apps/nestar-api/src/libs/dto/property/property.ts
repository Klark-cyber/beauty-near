import { Field, Int, ObjectType } from "@nestjs/graphql";
import * as mongoose from "mongoose";
import { PropertyLocation, PropertyStatus, PropertyType } from "../../enums/property.enum";
import { Member, TotalCounter } from "../member/member";
import { MeLiked } from "../like/like";


@ObjectType()
export class Property{
    @Field(() => String) //Field bu return boladigan resultni typeni tekshirib beradi
    _id: mongoose.Types.ObjectId;

   @Field(() => PropertyType)
   propertyType: PropertyType

  @Field(() => PropertyStatus)
   propertyStatus: PropertyStatus;

   @Field(() => PropertyLocation)
   propertyLocation: PropertyLocation;

   @Field(() => String)
   propertyAddress: string; 

   @Field(() => String)
   propertyTitle: string; 

   @Field(() => Int)
   propertyPrice: number; 

   @Field(() => Int)
   propertySquare: number; 

   @Field(() => Int)
   propertyBeds: number; 

    @Field(() => Int)
   propertyViews: number; 

   @Field(() => Int)
   propertyRooms: number; 

   @Field(() => Int)
   propertyLikes: number; 

   @Field(() => Int)
   propertyComments: number; 

   @Field(() => Int)
   propertyRank: number; 

   @Field(() => [String])
   propertyImages: string[];

   @Field(() => String, {nullable: true} )
   propertyDesc?: string;

   @Field(() => Boolean)
   propertyBarter: boolean;

    @Field(() => Boolean)
   propertyRent: boolean;

   @Field(() => String)
   memberId: mongoose.ObjectId;

    @Field(() => Date, {nullable: true} ) 
    soldAt?: Date; 

    @Field(() => Date, {nullable: true} ) 
    deletedAt?: Date; 

    @Field(() => Date, {nullable: true} ) 
    constructedAt?: Date; 

   @Field(() => Date ) 
    createdAt: Date; 

    @Field(() => Date ) 
    updatedAt: Date;

    //from aggregations
      @Field(() => Member, {nullable: true})
    memberData?: Member;

    /** from aggregation  */
        @Field(() => [MeLiked], { nullable: true })
        meLiked?: MeLiked[];
}

@ObjectType()
export class Properties{
    @Field(() => [Property])
    list: Property[];

    @Field(() => [TotalCounter], {nullable: true})
    metaCounter?: TotalCounter[]
}


