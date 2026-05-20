import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import * as mongoose from 'mongoose';
import { SalonLocation, SalonStatus, SalonType } from '../../enums/salon.enum';

@InputType()
export class SalonUpdate {
    @IsNotEmpty()
    @Field(() => String)
    _id: mongoose.ObjectId;

    @IsOptional()
    @Field(() => SalonType, { nullable: true })
    salonType?: SalonType;

    @IsOptional()
    @Field(() => SalonStatus, { nullable: true })
    salonStatus?: SalonStatus;

    @IsOptional()
    @Field(() => SalonLocation, { nullable: true })
    salonLocation?: SalonLocation;

    @IsOptional()
    @Length(3, 100)
    @Field(() => String, { nullable: true })
    salonAddress?: string;

    @IsOptional()
    @Length(3, 100)
    @Field(() => String, { nullable: true })
    salonTitle?: string;

    @IsOptional()
    @Length(5, 500)
    @Field(() => String, { nullable: true })
    salonDesc?: string;

    @IsOptional()
    @Field(() => [String], { nullable: true })
    salonImages?: string[];

    @IsOptional()
    @Field(() => String, { nullable: true })
    salonPhone?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    salonWorkHours?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    salonInstagram?: string;

    // Geo lokatsiya yangilash
    @IsOptional()
    @Field(() => Number, { nullable: true })
    salonLatitude?: number;

    @IsOptional()
    @Field(() => Number, { nullable: true })
    salonLongitude?: number;

    deletedAt?: Date;
}