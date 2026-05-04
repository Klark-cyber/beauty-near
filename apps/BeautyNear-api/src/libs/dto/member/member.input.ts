import { Field, InputType, Int } from "@nestjs/graphql";
import {IsIn, IsNotEmpty, IsOptional, Length, Min} from "class-validator"
import { MemberAuthType, MemberStatus, MemberType } from "../../enums/member.enum";
import { availableAgentSorts, availableMemberSorts } from "../../config";
import type { Direction } from "readline";

// Frontend => Backend input types @InputType() orqali hosil qilinadi

@InputType() 
export class MemberInput { //kirib keladigan malumotlarni tekshirish uchun type
    @IsNotEmpty() //ushbu malumotni kiritish shart
    @Length(3, 12)
    @Field(() => String)
    memberNick: string;

     @IsNotEmpty()
    @Length(5, 12)
    @Field(() => String)
    memberPassword: string;
    
    @IsNotEmpty() 
    @Field(() => String)
    memberPhone: string;

    @IsOptional()
    @Field(() => MemberType, {nullable: true}) //nullable:true optional ekanligini anglatadi
    memberType?: MemberType;
    

    @IsOptional() //bu malumot optional
    @Field(() => MemberAuthType, {nullable: true}) //nullable:true optional ekanligini anglatadi
    memberAuthType?: MemberAuthType; 
}

@InputType()
export class LoginInput { //kirib keladigan malumotlarni tekshirish uchun type
    @IsNotEmpty() //ushbu malumotni kiritish shart
    @Length(3, 12)
    @Field(() => String)
    memberNick: string;

     @IsNotEmpty()
    @Length(5, 12)
    @Field(() => String)
    memberPassword: string;
    
}

@InputType() //search paytida agentlarni nomlari orqali topish uchun
class AIsearch {
    @IsOptional()
    @Field(() => String, {nullable: true})
    text?: string
}

@InputType()
export class AgentInquiry{
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number; //pagenation uchun kerak boladi

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn([availableAgentSorts]) //userlar agentlarni shu parametrlar boyicha sort qiladi
    @Field(() => String, {nullable: true}) //sorting mexanizm uchun
    sort?: string;

    @IsOptional()
    @Field(() => String, {nullable: true}) //sorting mexanizm uchun
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => AIsearch)
    search: AIsearch;
}


@InputType() //search paytida agentlarni nomlari orqali topish uchun
class MIsearch {
    @IsOptional()
    @Field(() => MemberType, {nullable: true}) //Agent userlarni typi boyicha sort qilishi mumkin
    memberType?: MemberType

    @IsOptional()
    @Field(() => MemberStatus, {nullable: true})
    memberStatus?: MemberStatus

    @IsOptional()
    @Field(() => String, {nullable: true})
    text?: string
}

@InputType()
export class MembersInquiry{
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number; //pagenation uchun kerak boladi

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn([availableMemberSorts]) //userlar agentlarni shu parametrlar boyicha sort qiladi
    @Field(() => String, {nullable: true}) //sorting mexanizm uchun
    sort?: string;

    @IsOptional()
    @Field(() => String, {nullable: true}) //sorting mexanizm uchun
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => MIsearch)
    search: MIsearch;
}