import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Follower, Followers, Following, Followings } from '../../libs/dto/follow/follow';
import { MemberService } from '../member/member.service';
import { Model, ObjectId } from 'mongoose';
import { Direction } from '../../libs/enums/common.enum';
import { Message } from '../../libs/enums/common.enum';
import { lookupAuthMemberFollowed, lookupAuthMemberLiked, lookupFollowerData, lookupFollowingData, shapeIntoMongoObjectId } from '../../libs/config';
import { FollowInquiry, FollowToggleInput } from '../../libs/dto/follow/follow.input';
import { T } from '../../libs/types/common';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class FollowService {
  constructor(
    @InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
    private readonly socketGateway: SocketGateway,
  ) { }

  public async subscribe(followerId: ObjectId, input: FollowToggleInput): Promise<Follower> {
    const { followingId, salonId, serviceId } = input;

    if (followingId) {
      if (followerId.toString() === followingId.toString()) {
        throw new InternalServerErrorException(Message.SELF_SUBSCRIPTION_DENIED);
      }
      const targetMember = await this.memberService.getMember(null, followingId);
      if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

      const result = await this.registerSubscription({ followerId, followingId });

      await this.memberService.memberStatsEditor({ _id: followerId, targetKey: 'memberFollowings', modifier: 1 });
      await this.memberService.memberStatsEditor({ _id: followingId, targetKey: 'memberFollowers', modifier: 1 });
      await this.socketGateway.notifyFollow(followerId, followingId);

      return result;
    }

    if (salonId) {
      const result = await this.registerSubscription({ followerId, salonId });
      await this.followModel.db.collection('salons').updateOne(
        { _id: shapeIntoMongoObjectId(salonId) },
        { $inc: { salonFollowers: 1 } },
      );
      return result;
    }

    if (serviceId) {
      const result = await this.registerSubscription({ followerId, serviceId });
      await this.followModel.db.collection('services').updateOne(
        { _id: shapeIntoMongoObjectId(serviceId) },
        { $inc: { serviceFollowers: 1 } },
      );
      return result;
    }

    throw new InternalServerErrorException(Message.BAD_REQUEST);
  }

  private async registerSubscription(data: T): Promise<Follower> {
    try {
      return await this.followModel.create(data);
    } catch (err) {
      console.log('Error, Follow.model:', err.message);
      // ⚠️ TUZATILDI: avval BARCHA xatolar "Create failed" deb
      // umumlashtirilar edi, bu esa haqiqiy sababni (masalan allaqachon
      // follow qilingan bo'lishi — unique index xatosi) yashirar edi.
      if (err.code === 11000) {
        throw new BadRequestException('You are already following this.');
      }
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async unsubscribe(followerId: ObjectId, input: FollowToggleInput): Promise<Follower> {
    const { followingId, salonId, serviceId } = input;

    if (followingId) {
      const targetMember = await this.memberService.getMember(null, followingId);
      if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

      const result = await this.followModel.findOneAndDelete({ followingId, followerId });
      if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

      await this.memberService.memberStatsEditor({ _id: followerId, targetKey: 'memberFollowings', modifier: -1 });
      await this.memberService.memberStatsEditor({ _id: followingId, targetKey: 'memberFollowers', modifier: -1 });

      // ⚠️ YANGI — avvalgi "You have a new follower" bildirishnomasi ham o'chadi
      await this.socketGateway.deleteFollowNotification(followerId, followingId);

      return result;
    }

    if (salonId) {
      const result = await this.followModel.findOneAndDelete({ salonId, followerId });
      if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
      await this.followModel.db.collection('salons').updateOne(
        { _id: shapeIntoMongoObjectId(salonId) },
        { $inc: { salonFollowers: -1 } },
      );
      return result;
    }

    if (serviceId) {
      const result = await this.followModel.findOneAndDelete({ serviceId, followerId });
      if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
      await this.followModel.db.collection('services').updateOne(
        { _id: shapeIntoMongoObjectId(serviceId) },
        { $inc: { serviceFollowers: -1 } },
      );
      return result;
    }

    throw new InternalServerErrorException(Message.BAD_REQUEST);
  }

  public async getMemberFollowings(memberId: ObjectId, input: FollowInquiry): Promise<Followings> {
    const { page, limit, search } = input;
    if (!search?.followerId) throw new InternalServerErrorException(Message.BAD_REQUEST);

    const match: T = {
      followerId: shapeIntoMongoObjectId(search.followerId),
      followingId: { $exists: true, $ne: null },
    };

    const result = await this.followModel
      .aggregate([
        { $match: match },
        { $sort: { createdAt: Direction.DESC } },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              lookupAuthMemberLiked(memberId, '$followingId'),
              lookupAuthMemberFollowed({ followerId: memberId, followingId: '$followingId' }),
              lookupFollowingData,
              { $unwind: { path: '$followingData', preserveNullAndEmptyArrays: true } },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  public async getMemberFollowers(memberId: ObjectId, input: FollowInquiry): Promise<Followers> {
    const { page, limit, search } = input;
    if (!search?.followingId) throw new InternalServerErrorException(Message.BAD_REQUEST);

    const match: T = { followingId: shapeIntoMongoObjectId(search.followingId) };

    const result = await this.followModel
      .aggregate([
        { $match: match },
        { $sort: { createdAt: Direction.DESC } },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              lookupAuthMemberLiked(memberId, '$followerId'),
              lookupAuthMemberFollowed({ followerId: memberId, followingId: '$followerId' }),
              lookupFollowerData,
              { $unwind: { path: '$followerData', preserveNullAndEmptyArrays: true } },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }
}