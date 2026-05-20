import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { MemberStatus, MemberType } from '../../enums/member.enum';
import type { ObjectId } from 'mongoose';

@InputType()
export class MemberUpdate {
    @Field(() => String, { nullable: true })
    _id?: ObjectId;

    @IsOptional()
    @Field(() => MemberType, { nullable: true })
    memberType?: MemberType;

    @IsOptional()
    @Field(() => MemberStatus, { nullable: true })
    memberStatus?: MemberStatus;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberPhone?: string;

    @IsOptional()
    @Length(3, 12)
    @Field(() => String, { nullable: true })
    memberNick?: string;

    @IsOptional()
    @Length(5, 12)
    @Field(() => String, { nullable: true })
    memberPassword?: string;

    @IsOptional()
    @Length(3, 100)
    @Field(() => String, { nullable: true })
    memberFullName?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberImage?: string;

    // Agent uchun: qo'shimcha portfolio rasmlari
    @IsOptional()
    @Field(() => [String], { nullable: true })
    memberPortfolio?: string[];

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberAddress?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberDesc?: string;

    // Agent uchun: yillik tajriba
    @IsOptional()
    @Field(() => Int, { nullable: true })
    memberExperience?: number;

    // Agent uchun: mutaxassislik sohalari
    @IsOptional()
    @Field(() => [String], { nullable: true })
    memberSpecialty?: string[];

    // Geo lokatsiya
    @IsOptional()
    @Field(() => Number, { nullable: true })
    memberLatitude?: number;

    @IsOptional()
    @Field(() => Number, { nullable: true })
    memberLongitude?: number;

    deletedAt?: Date;
}