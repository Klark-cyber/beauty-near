import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { ServiceStatus, ServiceType } from '../../enums/service.enum';

@InputType()
export class ServiceUpdate {
    @IsNotEmpty()
    @Field(() => String)
    _id: mongoose.ObjectId;

    @IsOptional()
    @Field(() => ServiceType, { nullable: true })
    serviceType?: ServiceType;

    @IsOptional()
    @Field(() => ServiceStatus, { nullable: true })
    serviceStatus?: ServiceStatus;

    @IsOptional()
    @Length(3, 100)
    @Field(() => String, { nullable: true })
    serviceTitle?: string;

    @IsOptional()
    @Length(5, 500)
    @Field(() => String, { nullable: true })
    serviceDesc?: string;

    @IsOptional()
    @Field(() => Int, { nullable: true })
    servicePrice?: number;

    @IsOptional()
    @IsInt()
    @Min(10)
    @Field(() => Int, { nullable: true })
    serviceDuration?: number;

    @IsOptional()
    @Field(() => [String], { nullable: true })
    serviceImages?: string[];

    deletedAt?: Date; // frontenddan kelmaydi
}