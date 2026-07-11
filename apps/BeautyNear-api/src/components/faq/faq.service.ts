import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Faq, Faqs } from '../../libs/dto/faq/faq';
import { AllFaqsInquiry, FaqInput, FaqsInquiry } from '../../libs/dto/faq/faq.input';
import { FaqUpdate } from '../../libs/dto/faq/faq.update';
import { FaqStatus } from '../../libs/enums/faq.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class FaqService {
	constructor(
		@InjectModel('Faq') private readonly faqModel: Model<Faq>,
	) { }

	public async createFaq(input: FaqInput): Promise<Faq> {
		try {
			return await this.faqModel.create(input);
		} catch (err) {
			console.log('Error, Faq.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateFaq(input: FaqUpdate): Promise<Faq> {
		const result = await this.faqModel.findByIdAndUpdate(input._id, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	// Ommaviy /cs sahifasi — faqat ACTIVE FAQlar
	public async getFaqs(input: FaqsInquiry): Promise<Faqs> {
		const { faqCategory } = input.search;
		const match: T = { faqStatus: FaqStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (faqCategory) match.faqCategory = faqCategory;

		const result = await this.faqModel
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

	public async getAllFaqsByAdmin(input: AllFaqsInquiry): Promise<Faqs> {
		const { faqStatus, faqCategory, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (faqStatus) match.faqStatus = faqStatus;
		if (faqCategory) match.faqCategory = faqCategory;
		if (text) match.faqQuestion = { $regex: new RegExp(text, 'i') };

		const result = await this.faqModel
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

	public async removeFaqByAdmin(faqId: ObjectId): Promise<Faq> {
		const result = await this.faqModel.findByIdAndDelete(faqId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
