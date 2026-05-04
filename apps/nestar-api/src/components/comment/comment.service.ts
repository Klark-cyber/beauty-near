import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { MemberService } from '../member/member.service';
import { PropertyService } from '../property/property.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { Model, ObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';

@Injectable()
export class CommentService {
 constructor(
  @InjectModel('Comment') private readonly commentModel: Model<Comment>,
  private readonly memberService: MemberService,
  private readonly propertyService: PropertyService,
  private readonly boardArticleService: BoardArticleService,
 ) {}

 public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
  input.memberId = memberId;

  let result: Comment | null = null; //trydan tashqarida yozishga sabab result 56 qatorda return qilindi.Agar try ichiga yozsak uni trydan tashqarida ishlata olmaymiz
  try {
   result = await this.commentModel.create(input);
  } catch (err) {
   console.log('Error, Service.model:', err.message);
   throw new BadRequestException(Message.CREATE_FAILED);
  }

  switch (input.commentGroup) {
   case CommentGroup.PROPERTY:
    await this.propertyService.propertyStatsEditor({
     _id: input.commentRefId,
     targetKey: 'propertyComments',
     modifier: 1,
    });
    break;
   case CommentGroup.ARTICLE:
    await this.boardArticleService.boardArticleStatsEditor({
     _id: input.commentRefId,
     targetKey: 'articleComments',
     modifier: 1,
    });
    break;
   case CommentGroup.MEMBER:
    await this.memberService.memberStatsEditor({
     _id: input.commentRefId,
     targetKey: 'memberComments',
     modifier: 1,
    });
    break;
}

if(!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
return result;
 }

 public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
  const { _id } = input;
  const result = await this.commentModel.findOneAndUpdate(
   {
    _id: _id,
    memberId: memberId,
    commentStatus: CommentStatus.ACTIVE,
   },
   input,
   {
    new: true,
   },
  );
  if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
  return result;
 }

public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> { //property yoki memberga yozilgan umumiy commentlar
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
      // meLiked
      ...lookupMember,
      { $unwind: '$memberData' },
     ],
     metaCounter: [{ $count: 'total' }],
    },
   },
  ]);
  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

  return result[0];
 }


 //ADMIN

 public async removeCommentByAdmin(input: ObjectId): Promise<Comment> { //comment article yokiproperty kabi muhim malumot emas shu sababli uni statusini delete ekanligini tekshirishga hojat yoq
  const result = await this.commentModel.findByIdAndDelete(input);
  if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
  return result;
 }

}