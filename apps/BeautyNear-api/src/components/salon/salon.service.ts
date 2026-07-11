import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Salon, Salons } from '../../libs/dto/salon/salon';
import { Direction } from '../../libs/enums/common.enum';
import { Message } from '../../libs/enums/common.enum';
import { AgentSalonsInquiry, AllSalonsInquiry, OrdinaryInquiry, SalonInput, SalonsInquiry } from '../../libs/dto/salon/salon.input';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { SalonStatus } from '../../libs/enums/salon.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { SalonUpdate } from '../../libs/dto/salon/salon.update';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class SalonService {
  constructor(
    @InjectModel('Salon') private readonly salonModel: Model<Salon>,
    @InjectModel('Follow') private readonly followModel: Model<any>,
    private readonly memberService: MemberService,
    private readonly viewService: ViewService,
    private readonly likeService: LikeService,
    private readonly socketGateway: SocketGateway,
  ) { }

  public async createSalon(input: SalonInput): Promise<Salon> {
    try {
      // ⚠️ TUZATILDI: avval salonLocation2d hech qachon to'ldirilmagan
      // edi — standart qiymati [0,0] (Gvineya ko'rfazi) bo'lib qolar edi,
      // shuning uchun $geoNear (Nearby Salons) HECH QANDAY salonni to'g'ri
      // masofada topa olmas edi.
      if (input.salonLatitude !== undefined && input.salonLongitude !== undefined) {
        (input as any).salonLocation2d = {
          type: 'Point',
          coordinates: [input.salonLongitude, input.salonLatitude], // [lng, lat] tartibi MongoDB standarti
        };
      }
      const result = await this.salonModel.create(input);
      await this.memberService.memberStatsEditor({
        _id: result.memberId,
        targetKey: 'memberSalons',
        modifier: 1,
      });

      // Followchilarga yangi salon notification
      await this.socketGateway.notifyNewPost(
        result.memberId,
        result.salonTitle,
        result._id as any,
      );

      return result;
    } catch (err) {
      console.log('Error, Service.model:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getSalon(memberId: ObjectId, salonId: ObjectId): Promise<Salon> {
    const search: T = { _id: salonId, salonStatus: SalonStatus.ACTIVE };

    const targetSalon = await this.salonModel.findOne(search).lean().exec();
    if (!targetSalon) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (memberId) {
      const viewInput = { memberId: memberId, viewRefId: salonId, viewGroup: ViewGroup.SALON };
      const newView = await this.viewService.recordView(viewInput);
      if (newView) {
        await this.salonStatsEditor({ _id: salonId, targetKey: 'salonViews', modifier: 1 });
        targetSalon.salonViews++;
      }

      const likeInput = { memberId: memberId, likeRefId: salonId, likeGroup: LikeGroup.SALON };
      targetSalon.meLiked = (await this.likeService.checkLikeExistence(likeInput)) as any;

      // ⚠️ TUZATILDI: avval salon'ning o'z meFollowed'i hech qachon
      // to'ldirilmagan edi — shuning uchun frontend "Follow Salon"
      // tugmasi doim "Follow" ko'rsatib, takroriy urinishda "Create
      // failed" xatosiga olib kelar edi.
      const salonFollowExists = await this.followModel
        .findOne({ followerId: memberId, salonId: salonId })
        .exec();
      targetSalon.meFollowed = (salonFollowExists
        ? [{ followerId: memberId, followingId: salonId, myFollowing: true }]
        : []) as any;
    }

    // ⚠️ TUZATILDI: avval getMember(null, ...) chaqirilar edi — birinchi
    // argument "null" bo'lgani uchun getMember o'zining ichki
    // meFollowed/meLiked hisoblash blokini o'tkazib yuborar edi (u faqat
    // "if (memberId)" shartida ishlaydi). Natijada salon egasining
    // (memberData) meFollowed maydoni ham doim bo'sh qolar edi.
    // ⚠️ TUZATILDI: getMember(memberId, ...) chaqirish yon ta'sirga ega
    // edi — u ichida profil ko'rishlar sonini ham oshirar edi (salon
    // ko'rilganda, egasining profil-ko'rishi ham noto'g'ri oshib ketardi).
    // Shuning uchun getMember(null, ...) qoldiriladi (yon ta'sirsiz), lekin
    // memberData.meFollowed alohida, to'g'ridan-to'g'ri hisoblanadi.
    targetSalon.memberData = (await this.memberService.getMember(null, targetSalon.memberId)) as any;
    if (memberId && targetSalon.memberData) {
      const ownerFollowExists = await this.followModel
        .findOne({ followerId: memberId, followingId: targetSalon.memberId })
        .exec();
      (targetSalon.memberData as any).meFollowed = ownerFollowExists
        ? [{ followerId: memberId, followingId: targetSalon.memberId, myFollowing: true }]
        : [];
    }
    return targetSalon;
  }

  public async updateSalon(memberId: ObjectId, input: SalonUpdate): Promise<Salon> {
    const { salonStatus } = input as any;
    const search: T = { _id: input._id, memberId: memberId, salonStatus: SalonStatus.ACTIVE };

    if (salonStatus === SalonStatus.DELETE) input.deletedAt = new Date();

    // ⚠️ Koordinata yangilansa, salonLocation2d ham sinxronlanadi
    if ((input as any).salonLatitude !== undefined && (input as any).salonLongitude !== undefined) {
      (input as any).salonLocation2d = {
        type: 'Point',
        coordinates: [(input as any).salonLongitude, (input as any).salonLatitude],
      };
    }

    const result = await this.salonModel.findOneAndUpdate(search, input, { new: true }).exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (salonStatus === SalonStatus.DELETE) {
      await this.memberService.memberStatsEditor({ _id: memberId, targetKey: 'memberSalons', modifier: -1 });
    }

    return result;
  }

  public async getSalons(memberId: ObjectId, input: SalonsInquiry): Promise<Salons> {
    const { latitude, longitude, radius } = input.search;
    const match: T = { salonStatus: SalonStatus.ACTIVE };
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    this.shapeMatchQuery(match, input);

    const useGeo = latitude !== undefined && longitude !== undefined && radius !== undefined;
    const pipeline: any[] = [];

    if (useGeo) {
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: radius * 1000,
          spherical: true,
          query: match,
        },
      });
    } else {
      pipeline.push({ $match: match });
      pipeline.push({ $sort: sort });
    }

    pipeline.push({
      $facet: {
        list: [
          { $skip: (input.page - 1) * input.limit },
          { $limit: input.limit },
          lookupAuthMemberLiked(memberId),
          ...lookupMember,
          { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
        ],
        metaCounter: [{ $count: 'total' }],
      },
    });

    const result = await this.salonModel.aggregate(pipeline).exec();
    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  private shapeMatchQuery(match: T, input: SalonsInquiry): void {
    const { memberId, locationList, typeList, text } = input.search;

    if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
    if (locationList) match.salonLocation = { $in: locationList };
    if (typeList) match.salonType = { $in: typeList };
    if (text) match.salonTitle = { $regex: new RegExp(text, 'i') };
  }

  public async getFavoriteSalons(memberId: ObjectId, input: OrdinaryInquiry): Promise<Salons> {
    return await this.likeService.getFavoriteSalons(memberId, input);
  }

  public async getVisitedSalons(memberId: ObjectId, input: OrdinaryInquiry): Promise<Salons> {
    return await this.viewService.getVisitedSalons(memberId, input);
  }

  public async getAgentSalons(memberId: ObjectId, input: AgentSalonsInquiry): Promise<Salons> {
    const { salonStatus } = input.search;
    if (salonStatus === SalonStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

    const match: T = {
      memberId: memberId,
      salonStatus: salonStatus ?? { $ne: SalonStatus.DELETE },
    };
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    const result = await this.salonModel
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

  public async likeTargetSalon(memberId: ObjectId, likeRefId: ObjectId): Promise<Salon> {
    const target = await this.salonModel
      .findOne({ _id: likeRefId, salonStatus: SalonStatus.ACTIVE })
      .exec() as Salon;
    if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const input: LikeInput = { memberId, likeRefId, likeGroup: LikeGroup.SALON };
    const modifier: number = await this.likeService.toggleLike(input);
    const result = await this.salonStatsEditor({ _id: likeRefId, targetKey: 'salonLikes', modifier });

    if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
    return result;
  }

  /* ADMIN */

  public async getAllSalonsByAdmin(input: AllSalonsInquiry): Promise<Salons> {
    const { salonStatus, salonLocationList } = input.search;
    const match: T = {};
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    if (salonStatus) match.salonStatus = salonStatus;
    if (salonLocationList) match.salonLocation = { $in: salonLocationList };

    const result = await this.salonModel
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

  public async updateSalonByAdmin(input: SalonUpdate): Promise<Salon> {
    const { salonStatus } = input as any;
    const search: T = { _id: input._id, salonStatus: SalonStatus.ACTIVE };

    if (salonStatus === SalonStatus.DELETE) input.deletedAt = new Date();

    const result = await this.salonModel.findOneAndUpdate(search, input, { new: true }).exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (salonStatus === SalonStatus.DELETE) {
      await this.memberService.memberStatsEditor({ _id: result.memberId, targetKey: 'memberSalons', modifier: -1 });
    }

    return result;
  }

  public async removeSalonByAdmin(salonId: ObjectId): Promise<Salon> {
    const search: T = { _id: salonId, salonStatus: SalonStatus.DELETE };
    const result = await this.salonModel.findOneAndDelete(search).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }

  public async salonStatsEditor(input: StatisticModifier): Promise<Salon | null> {
    const { _id, targetKey, modifier } = input;
    return await this.salonModel
      .findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
      .exec();
  }

  // Agent aksiya e'lon qilganda followchilarga notification
  public async announceDiscount(memberId: ObjectId, salonId: ObjectId): Promise<void> {
    const salon = await this.salonModel.findById(salonId).select('salonTitle').exec();
    if (!salon) return;
    await this.socketGateway.notifyDiscount(memberId, salon.salonTitle, salonId);
  }

  // Bugun bo'sh vaqt ochilganda followchilarga notification
  public async announceFreeSlot(memberId: ObjectId, salonId: ObjectId): Promise<void> {
    const salon = await this.salonModel.findById(salonId).select('salonTitle').exec();
    if (!salon) return;
    await this.socketGateway.notifyFreeSlot(memberId, salon.salonTitle, salonId);
  }
}