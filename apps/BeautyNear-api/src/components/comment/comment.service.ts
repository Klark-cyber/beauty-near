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
import { LikeService } from '../like/like.service'; // ⚠️ YANGI
import { LikeGroup } from '../../libs/enums/like.enum'; // ⚠️ YANGI
import { SocketGateway } from '../../socket/socket.gateway'; // ⚠️ YANGI
import { NotificationGroup } from '../../libs/enums/notification.enum'; // ⚠️ YANGI
import { LikeInput } from '../../libs/dto/like/like.input'; // ⚠️ YANGI

@Injectable()
export class CommentService {
  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,
    @InjectModel('Booking') private readonly bookingModel: Model<any>,
    @InjectModel('Service') private readonly serviceModel: Model<any>,
    private readonly memberService: MemberService,
    private readonly salonService: SalonService,
    private readonly boardArticleService: BoardArticleService,
    private readonly likeService: LikeService, // ⚠️ YANGI
    private readonly socketGateway: SocketGateway, // ⚠️ YANGI — like notification uchun
  ) { }

  // ⚠️ YANGI — bitta izohga like bosish/olib tashlash
  public async likeTargetComment(memberId: ObjectId, commentId: ObjectId): Promise<Comment> {
    const target = await this.commentModel.findOne({ _id: commentId, commentStatus: CommentStatus.ACTIVE }).exec();
    if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const input: LikeInput = { memberId, likeRefId: commentId, likeGroup: LikeGroup.COMMENT };
    const modifier: number = await this.likeService.toggleLike(input);

    const result = await this.commentModel
      .findByIdAndUpdate(commentId, { $inc: { commentLikes: modifier } }, { new: true })
      .exec();
    if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

    // ⚠️ YANGI — faqat YANGI like bosilganda (unlike'da emas) va
    // o'zining izohiga o'zi like bosmagan bo'lsa, egasiga xabar boradi
    // ⚠️ TUZATILDI: avval har doim NotificationGroup.MEMBER yuborilar
    // edi — bu esa bosilganda qayerga borishni frontend ANIQLAY olmasdi
    // (umumiy Followers sahifasiga ketardi). Endi izohning O'ZI qaysi
    // obyektga (Salon yoki Article) tegishli bo'lsa, o'sha aniqlanadi —
    // bosilganda TO'G'RIDAN-TO'G'RI o'sha obyektning detail sahifasiga
    // (izohlar ochiq holda) olib boradi.
    if (modifier === 1 && target.memberId?.toString() !== memberId.toString()) {
      const group = target.commentGroup === CommentGroup.ARTICLE ? NotificationGroup.ARTICLE : NotificationGroup.SALON;
      await this.socketGateway.notifyLike(memberId, target.memberId, group, 'liked your comment', target.commentRefId);
    } else if (modifier === -1 && target.memberId?.toString() !== memberId.toString()) {
      // ⚠️ YANGI — unlike qilinganda avvalgi bildirishnoma ham o'chadi
      await this.socketGateway.deleteLikeNotification(memberId, target.memberId);
    }

    return result;
  }

  public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
    input.memberId = memberId;

    // Review logikasi: faqat COMPLETED bookingdan keyin yozish mumkin
    // ⚠️ TUZATILDI: avval faqat SERVICE uchun tekshirilar edi — endi SALON uchun ham
    if (input.commentGroup === CommentGroup.SERVICE || input.commentGroup === CommentGroup.SALON) {
      await this.checkCompletedBooking(memberId, input.commentRefId, input.commentGroup);
    }

    let result: Comment | null = null;
    try {
      result = await this.commentModel.create(input);
    } catch (err) {
      console.log('Error, Service.model:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }

    switch (input.commentGroup) {
      case CommentGroup.SALON: {
        const salon = await this.salonService.salonStatsEditor({
          _id: input.commentRefId,
          targetKey: 'salonComments',
          modifier: 1,
        });
        await this.updateSalonRating(input.commentRefId);
        // ⚠️ YANGI — avval umuman notification yuborilmasdi
        if (salon?.memberId && salon.memberId.toString() !== memberId.toString()) {
          await this.socketGateway.notifyComment(memberId, salon.memberId, NotificationGroup.SALON, 'left a review on your salon', input.commentRefId);
        }
        break;
      }

      case CommentGroup.SERVICE:
        // serviceComments counter va rating yangilanadi
        await this.serviceModel
          .findByIdAndUpdate(input.commentRefId, { $inc: { serviceComments: 1 } })
          .exec();
        await this.updateServiceRating(input.commentRefId);
        break;

      case CommentGroup.ARTICLE: {
        const article = await this.boardArticleService.boardArticleStatsEditor({
          _id: input.commentRefId,
          targetKey: 'articleComments',
          modifier: 1,
        });
        // ⚠️ YANGI — avval umuman notification yuborilmasdi
        if (article?.memberId && article.memberId.toString() !== memberId.toString()) {
          await this.socketGateway.notifyComment(memberId, article.memberId, NotificationGroup.ARTICLE, 'commented on your article', input.commentRefId);
        }
        break;
      }
    }

    if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
    return result;
  }

  // Foydalanuvchi bu xizmatga (yoki salonga) COMPLETED holda band qilganmi tekshiramiz
  // ⚠️ TUZATILDI: endi SALON guruhi uchun ham ishlaydi (avval faqat SERVICE)
  private async checkCompletedBooking(memberId: ObjectId, refId: ObjectId, group: CommentGroup): Promise<void> {
    const bookingMatch: T =
      group === CommentGroup.SALON
        ? { memberId, salonId: refId, bookingStatus: BookingStatus.COMPLETED }
        : { memberId, serviceId: refId, bookingStatus: BookingStatus.COMPLETED };

    const completedBooking = await this.bookingModel.findOne(bookingMatch).exec();

    if (!completedBooking) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    // Bir xizmatga/salonga bir review — oldin yozganmi tekshiramiz
    const existingReview = await this.commentModel
      .findOne({
        memberId: memberId,
        commentRefId: refId,
        commentGroup: group,
        commentStatus: CommentStatus.ACTIVE,
      })
      .exec();

    if (existingReview) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }
  }

  // serviceRating ni barcha faol reviewlar (commentRating) asosida qayta hisoblaymiz
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

    const avg = reviews.reduce((sum, r: any) => sum + (r.commentRating ?? 5), 0) / count;

    await this.serviceModel
      .findByIdAndUpdate(serviceId, { $set: { serviceComments: count, serviceRating: Math.round(avg * 10) / 10 } }, { new: true })
      .exec();
  }

  // salonRating ni barcha faol reviewlar (commentRating) asosida qayta hisoblaymiz
  private async updateSalonRating(salonId: ObjectId): Promise<void> {
    const reviews = await this.commentModel
      .find({
        commentRefId: salonId,
        commentGroup: CommentGroup.SALON,
        commentStatus: CommentStatus.ACTIVE,
      })
      .exec();

    const count = reviews.length;
    if (count === 0) return;

    const avg = reviews.reduce((sum, r: any) => sum + (r.commentRating ?? 5), 0) / count;
    await this.salonService.updateSalonRating(salonId, Math.round(avg * 10) / 10);
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
    const { commentRefId, commentGroup } = input.search;
    const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
    if (commentGroup) match.commentGroup = commentGroup;
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

    // ⚠️ YANGI — har bir izoh uchun joriy foydalanuvchi like bosganmi tekshiramiz
    if (memberId && result[0]?.list?.length) {
      for (const comment of result[0].list as any[]) {
        const likeInput = { memberId, likeRefId: comment._id, likeGroup: LikeGroup.COMMENT };
        comment.meLiked = await this.likeService.checkLikeExistence(likeInput);
      }
    }

    return result[0];
  }

  /* ADMIN */

  public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
    const result = await this.commentModel.findByIdAndDelete(input);
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }
}