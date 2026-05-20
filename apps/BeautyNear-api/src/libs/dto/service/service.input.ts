import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { ServiceStatus, ServiceType } from '../../enums/service.enum';
import { SalonLocation } from '../../enums/salon.enum';
import { Direction } from '../../enums/common.enum';
import { availableServiceSorts } from '../../config';

@InputType()
export class ServiceInput {
    @IsNotEmpty()
    @Field(() => ServiceType)
    serviceType: ServiceType;

    @IsNotEmpty()
    @Length(3, 100)
    @Field(() => String)
    serviceTitle: string;

    @IsOptional()
    @Length(5, 500)
    @Field(() => String, { nullable: true })
    serviceDesc?: string;

    @IsNotEmpty()
    @Field(() => Int)
    servicePrice: number;

    @IsNotEmpty()
    @IsInt()
    @Min(10)
    @Field(() => Int)
    serviceDuration: number; // daqiqada (masalan: 60)

    @IsOptional()
    @Field(() => [String], { nullable: true })
    serviceImages?: string[]; // before/after rasmlar

    salonId?: mongoose.ObjectId;  // AuthMember + agent salonidan olinadi
    memberId?: mongoose.ObjectId; // AuthMember dekorator orqali qo'shiladi
}

// User tomonidan xizmatlarni qidirish uchun search class
@InputType()
class SVISearch {
    @IsOptional()
    @Field(() => String, { nullable: true })
    memberId?: mongoose.ObjectId;

    @IsOptional()
    @Field(() => String, { nullable: true })
    salonId?: mongoose.ObjectId;

    @IsOptional()
    @Field(() => [ServiceType], { nullable: true })
    typeList?: ServiceType[];

    @IsOptional()
    @Field(() => [SalonLocation], { nullable: true })
    locationList?: SalonLocation[]; // salon lokatsiyasi orqali filter

    @IsOptional()
    @Field(() => Int, { nullable: true })
    priceMin?: number;

    @IsOptional()
    @Field(() => Int, { nullable: true })
    priceMax?: number;

    @IsOptional()
    @Field(() => Int, { nullable: true })
    durationMax?: number; // maksimum davomiylik (daqiqada)

    @IsOptional()
    @Field(() => String, { nullable: true })
    text?: string;
}

@InputType()
export class ServicesInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableServiceSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => SVISearch)
    search: SVISearch;
}

// Agent o'z xizmatlarini boshqarishi uchun
@InputType()
class ASVISearch {
    @IsOptional()
    @Field(() => ServiceStatus, { nullable: true })
    serviceStatus?: ServiceStatus;
}

@InputType()
export class AgentServicesInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableServiceSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => ASVISearch)
    search: ASVISearch;
}