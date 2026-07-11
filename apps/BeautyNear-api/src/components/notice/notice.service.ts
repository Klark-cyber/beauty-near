import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { AllNoticesInquiry, NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class NoticeService {
	constructor(
		@InjectModel('Notice') private readonly noticeModel: Model<Notice>,
	) { }

	public async createNotice(input: NoticeInput): Promise<Notice> {
		try {
			return await this.noticeModel.create(input);
		} catch (err) {
			console.log('Error, Notice.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateNotice(input: NoticeUpdate): Promise<Notice> {
		const result = await this.noticeModel.findByIdAndUpdate(input._id, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	// Bitta e'lonni ko'rish (detail) — ko'rishlar sonini oshiradi
	public async getNotice(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel
			.findOneAndUpdate(
				{ _id: noticeId, noticeStatus: NoticeStatus.ACTIVE },
				{ $inc: { noticeViews: 1 } },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	// Ommaviy /cs sahifasi — faqat ACTIVE, pinlangan e'lonlar yuqorida
	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		const { noticeType } = input.search;
		const match: T = { noticeStatus: NoticeStatus.ACTIVE };
		const sort: T = { noticePinned: -1, [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (noticeType) match.noticeType = noticeType;

		const result = await this.noticeModel
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

	public async getAllNoticesByAdmin(input: AllNoticesInquiry): Promise<Notices> {
		const { noticeStatus, noticeType, text } = input.search;
		const match: T = {};
		const sort: T = { noticePinned: -1, [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (noticeStatus) match.noticeStatus = noticeStatus;
		if (noticeType) match.noticeType = noticeType;
		if (text) match.noticeTitle = { $regex: new RegExp(text, 'i') };

		const result = await this.noticeModel
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

	public async removeNoticeByAdmin(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel.findByIdAndDelete(noticeId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
