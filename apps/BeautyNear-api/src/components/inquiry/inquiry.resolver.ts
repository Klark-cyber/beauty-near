import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { InquiryService } from './inquiry.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import * as mongoose from 'mongoose';
import { Inquiry, Inquiries } from '../../libs/dto/inquiry/inquiry';
import { AllInquiriesInquiry, InquiryInput, MyInquiriesInquiry } from '../../libs/dto/inquiry/inquiry.input';
import { InquiryUpdate } from '../../libs/dto/inquiry/inquiry.update';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class InquiryResolver {
	constructor(private readonly inquiryService: InquiryService) { }

	// ⚠️ Ro'yxatdan o'tmagan foydalanuvchi murojaat qoldira olmaydi (tasdiqlangan)
	@UseGuards(AuthGuard)
	@Mutation(() => Inquiry)
	public async createInquiry(
		@Args('input') input: InquiryInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Inquiry> {
		console.log('Mutation: createInquiry');
		return await this.inquiryService.createInquiry(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Inquiries)
	public async getMyInquiries(
		@Args('input') input: MyInquiriesInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Inquiries> {
		console.log('Query: getMyInquiries');
		return await this.inquiryService.getMyInquiries(memberId, input);
	}

	/* ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Inquiries)
	public async getAllInquiriesByAdmin(@Args('input') input: AllInquiriesInquiry): Promise<Inquiries> {
		console.log('Query: getAllInquiriesByAdmin');
		return await this.inquiryService.getAllInquiriesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Inquiry)
	public async updateInquiryByAdmin(@Args('input') input: InquiryUpdate): Promise<Inquiry> {
		console.log('Mutation: updateInquiryByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.inquiryService.updateInquiryByAdmin(input);
	}
}
