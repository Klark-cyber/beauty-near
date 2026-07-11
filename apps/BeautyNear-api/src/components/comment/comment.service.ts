import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { MemberService } from '../member/member.service';
import { SalonService } from '../salon/salon.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { Model, ObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Direction } from '../../libs/enums/common.enum';
import { Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';
import { BookingStatus } from '../../libs/enums/booking.enum';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,
    @InjectModel('Booking') private readonly bookingModel: Model<any>,
    @InjectModel('Service') private readonly serviceModel: Model<any>,
    private readonly memberService: MemberService,
    private readonly salonService: SalonService,
    private readonly boardArticleService: BoardArticleService,
  ) { }

  public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
    input.memberId = memberId;

    // Review logikasi: faqat COMPLETED bookingdan keyin yozish mumkin
    if (input.commentGroup === CommentGroup.SERVICE) {
      await this.checkCompletedBooking(memberId, input.commentRefId);
    }

    let result: Comment | null = null;
    try {
      result = await this.commentModel.create(input);
    } catch (err) {
      console.log('Error, Service.model:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }

    switch (input.commentGroup) {
      case CommentGroup.SALON:
        await this.salonService.salonStatsEditor({
          _id: input.commentRefId,
          targetKey: 'salonComments',
          modifier: 1,
        });
        break;

      case CommentGroup.SERVICE:
        // serviceComments counter va rating yangilanadi
        await this.serviceModel
          .findByIdAndUpdate(input.commentRefId, { $inc: { serviceComments: 1 } })
          .exec();
        await this.updateServiceRating(input.commentRefId);
        break;

      case CommentGroup.ARTICLE:
        await this.boardArticleService.boardArticleStatsEditor({
          _id: input.commentRefId,
          targetKey: 'articleComments',
          modifier: 1,
        });
        break;
    }

    if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
    return result;
  }

  // Foydalanuvchi bu xizmatni COMPLETED holda band qilganmi tekshiramiz
  private async checkCompletedBooking(memberId: ObjectId, serviceId: ObjectId): Promise<void> {
    const completedBooking = await this.bookingModel
      .findOne({
        memberId: memberId,
        serviceId: serviceId,
        bookingStatus: BookingStatus.COMPLETED,
      })
      .exec();

    if (!completedBooking) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    // Bir xizmatga bir review — oldin yozganmi tekshiramiz
    const existingReview = await this.commentModel
      .findOne({
        memberId: memberId,
        commentRefId: serviceId,
        commentGroup: CommentGroup.SERVICE,
        commentStatus: CommentStatus.ACTIVE,
      })
      .exec();

    if (existingReview) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }
  }

  // serviceRating ni barcha reviewlar asosida qayta hisoblaymiz
  private async updateServiceRating(serviceId: ObjectId): Promise<void> {
    const reviews = await this.commentModel
      .find({
        commentRefId: serviceId,
        commentGroup: CommentGroup.SERVICE,
        commentStatus: CommentStatus.ACTIVE,
      })
      .exec();

    const count = reviews.length;
    if (count === 0) return;

    // Kelajakda comment ichida rating (1-5) field qoshilganda
    // avg = reviews.reduce((sum, r) => sum + r.rating, 0) / count
    // Hozircha serviceComments ni set qilamiz
    await this.serviceModel
      .findByIdAndUpdate(serviceId, { $set: { serviceComments: count } }, { new: true })
      .exec();
  }

  public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
    const { _id } = input;
    const result = await this.commentModel.findOneAndUpdate(
      { _id: _id, memberId: memberId, commentStatus: CommentStatus.ACTIVE },
      input,
      { new: true },
    );
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
    const { commentRefId } = input.search;
    const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    const result: Comments[] = await this.commentModel.aggregate([
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
    ]);

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  /* ADMIN */

  public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
    const result = await this.commentModel.findByIdAndDelete(input);
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }
}