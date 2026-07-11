import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Inquiry, Inquiries } from '../../libs/dto/inquiry/inquiry';
import { AllInquiriesInquiry, InquiryInput, MyInquiriesInquiry } from '../../libs/dto/inquiry/inquiry.input';
import { InquiryUpdate } from '../../libs/dto/inquiry/inquiry.update';
import { InquiryStatus } from '../../libs/enums/inquiry.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';

@Injectable()
export class InquiryService {
	constructor(
		@InjectModel('Inquiry') private readonly inquiryModel: Model<Inquiry>,
	) { }

	public async createInquiry(memberId: ObjectId, input: InquiryInput): Promise<Inquiry> {
		input.memberId = memberId;
		try {
			return await this.inquiryModel.create(input);
		} catch (err) {
			console.log('Error, Inquiry.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// Foydalanuvchi — faqat o'z murojaatlari
	public async getMyInquiries(memberId: ObjectId, input: MyInquiriesInquiry): Promise<Inquiries> {
		const { inquiryStatus } = input.search;
		const match: T = { memberId };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (inquiryStatus) match.inquiryStatus = inquiryStatus;

		const result = await this.inquiryModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	/* ADMIN */

	public async getAllInquiriesByAdmin(input: AllInquiriesInquiry): Promise<Inquiries> {
		const { inquiryStatus, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (inquiryStatus) match.inquiryStatus = inquiryStatus;
		if (text) match.inquirySubject = { $regex: new RegExp(text, 'i') };

		const result = await this.inquiryModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							...lookupMember,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	// ⚠️ Mockup'dagi qoidaga ko'ra: javob yozilganda status AVTOMATIK
	// "ANSWERED"ga o'zgaradi (admin buni qo'lda tanlashi shart emas).
	// Status'ni qo'lda o'zgartirish ham mumkin (masalan "CLOSED" qilish uchun).
	public async updateInquiryByAdmin(input: InquiryUpdate): Promise<Inquiry> {
		const updateData: T = { ...input };
		if (input.inquiryReply && !input.inquiryStatus) {
			updateData.inquiryStatus = InquiryStatus.ANSWERED;
		}

		const result = await this.inquiryModel.findByIdAndUpdate(input._id, updateData, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}
}