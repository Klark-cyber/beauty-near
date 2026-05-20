import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { SalonLocation, SalonStatus, SalonType } from '../../enums/salon.enum';
import { Direction } from '../../enums/common.enum';
import { availableSalonSorts } from '../../config';

@InputType()
export class SalonInput {
    @IsNotEmpty()
    @Field(() => SalonType)
    salonType: SalonType;

    @IsNotEmpty()
    @Field(() => SalonLocation)
    salonLocation: SalonLocation;

    @IsNotEmpty()
    @Length(3, 100)
    @Field(() => String)
    salonAddress: string;

    @IsNotEmpty()
    @Length(3, 100)
    @Field(() => String)
    salonTitle: string;

    @IsOptional()
    @Length(5, 500)
    @Field(() => String, { nullable: true })
    salonDesc?: string;

    @IsNotEmpty()
    @Field(() => [String])
    salonImages: string[];

    @IsNotEmpty()
    @Field(() => String)
    salonPhone: string;

    @IsNotEmpty()
    @Field(() => String)
    salonWorkHours: string; // "09:00-21:00"

    @IsOptional()
    @Field(() => String, { nullable: true })
    salonInstagram?: string;

    // Geo lokatsiya
    @IsOptional()
    @Field(() => Number, { nullable: true })
    salonLatitude?: number;

    @IsOptional()
    @Field(() => Number, { nullable: true })
    salonLongitude?: number;

    memberId?: mongoose.ObjectId; // AuthMember dekorator orqali qo'shiladi
}

@InputType()
class SISearch {
    @IsOptional()
    @Field(() => String, { nullable: true })
    memberId?: mongoose.ObjectId;

    @IsOptional()
    @Field(() => [SalonLocation], { nullable: true })
    locationList?: SalonLocation[];

    @IsOptional()
    @Field(() => [SalonType], { nullable: true })
    typeList?: SalonType[];

    // Geo filter — user joylashgan nuqtadan radius (km)
    @IsOptional()
    @Field(() => Number, { nullable: true })
    latitude?: number;

    @IsOptional()
    @Field(() => Number, { nullable: true })
    longitude?: number;

    @IsOptional()
    @Field(() => Number, { nullable: true })
    radius?: number; // km: 0.5 | 1 | 3 | 5

    @IsOptional()
    @Field(() => String, { nullable: true })
    text?: string;
}

@InputType()
export class SalonsInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableSalonSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => SISearch)
    search: SISearch;
}

@InputType()
class ASISearch {
    @IsOptional()
    @Field(() => SalonStatus, { nullable: true })
    salonStatus?: SalonStatus;
}

@InputType()
export class AgentSalonsInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableSalonSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => ASISearch)
    search: ASISearch;
}

@InputType()
class ALSISearch {
    @IsOptional()
    @Field(() => SalonStatus, { nullable: true })
    salonStatus?: SalonStatus;

    @IsOptional()
    @Field(() => [SalonLocation], { nullable: true })
    salonLocationList?: SalonLocation[];
}

@InputType()
export class AllSalonsInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableSalonSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => ALSISearch)
    search: ALSISearch;
}

@InputType()
export class OrdinaryInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;
}