import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';
import { OrdinaryInquiry } from '../../libs/dto/salon/salon.input';
import { Salons } from '../../libs/dto/salon/salon';
import { Services } from '../../libs/dto/service/service';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class LikeService {
    constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) { }

    public async toggleLike(input: LikeInput): Promise<number> {
        // ⚠️ TUZATILDI: avval likeGroup hisobga olinmagan edi — faqat
        // memberId+likeRefId bo'yicha tekshirilar edi
        const search: T = { memberId: input.memberId, likeRefId: input.likeRefId, likeGroup: input.likeGroup };
        const exist = await this.likeModel.findOne(search).exec();
        let modifier = 1;

        if (exist) {
            await this.likeModel.findOneAndDelete(search).exec();
            modifier = -1;
        } else {
            try {
                await this.likeModel.create(input);
            } catch (err) {
                console.log('ERROR, Service.model:', err.message);
                throw new BadRequestException(Message.CREATE_FAILED);
            }
        }

        console.log('- Like modifier:', modifier);
        return modifier;
    }

    public async checkLikeExistence(input: LikeInput): Promise<MeLiked[]> {
        const { memberId, likeRefId, likeGroup } = input;
        const result = await this.likeModel.findOne({ memberId: memberId, likeRefId: likeRefId, likeGroup: likeGroup }).exec();
        return result ? [{ memberId: memberId, likeRefId: likeRefId, myFavorite: true }] : [];
    }

    // User like bosgan salonlar
    public async getFavoriteSalons(memberId: ObjectId, input: OrdinaryInquiry): Promise<Salons> {
        const { page, limit } = input;
        const match: T = { likeGroup: LikeGroup.SALON, memberId: memberId };

        const data: T = await this.likeModel
            .aggregate([
                { $match: match },
                { $sort: { updatedAt: -1 } },
                {
                    $lookup: {
                        from: 'salons',
                        localField: 'likeRefId',
                        foreignField: '_id',
                        as: 'favoriteSalon',
                    },
                },
                // ⚠️ TUZATILDI: avval preserveNullAndEmptyArrays: true edi —
                // agar like bosilgan SALON keyinchalik o'CHIRILGAN bo'lsa,
                // bu yozuv baribir saqlanib qolar, natijada "favoriteSalon"
                // null bo'lib, GraphQL'ning majburiy _id maydoni buzilardi.
                // Endi bunday "yetim" (orphaned) like'lar butunlay chiqarib
                // tashlanadi (inner-join xatti-harakati).
                { $unwind: { path: '$favoriteSalon', preserveNullAndEmptyArrays: false } },
                {
                    $facet: {
                        list: [
                            { $skip: (page - 1) * limit },
                            { $limit: limit },
                            {
                                $lookup: {
                                    from: 'members',
                                    localField: 'favoriteSalon.memberId',
                                    foreignField: '_id',
                                    as: 'favoriteSalon.memberData',
                                },
                            },
                            { $unwind: { path: '$favoriteSalon.memberData', preserveNullAndEmptyArrays: true } },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        const result: Salons = { list: [], metaCounter: data[0].metaCounter };
        result.list = data[0].list.map((ele: T) => ele.favoriteSalon);
        return result;
    }

    // User like bosgan servicelar
    public async getFavoriteServices(memberId: ObjectId, input: OrdinaryInquiry): Promise<Services> {
        const { page, limit } = input;
        const match: T = { likeGroup: LikeGroup.SERVICE, memberId: memberId };

        const data: T = await this.likeModel
            .aggregate([
                { $match: match },
                { $sort: { updatedAt: -1 } },
                {
                    $lookup: {
                        from: 'services',
                        localField: 'likeRefId',
                        foreignField: '_id',
                        as: 'favoriteService',
                    },
                },
                // ⚠️ TUZATILDI: xuddi shu sabab — o'chirilgan service'ga
                // ishora qiluvchi "yetim" like'lar chiqarib tashlanadi
                { $unwind: { path: '$favoriteService', preserveNullAndEmptyArrays: false } },
                {
                    $facet: {
                        list: [
                            { $skip: (page - 1) * limit },
                            { $limit: limit },
                            {
                                $lookup: {
                                    from: 'members',
                                    localField: 'favoriteService.memberId',
                                    foreignField: '_id',
                                    as: 'favoriteService.memberData',
                                },
                            },
                            { $unwind: { path: '$favoriteService.memberData', preserveNullAndEmptyArrays: true } },
                            {
                                $lookup: {
                                    from: 'salons',
                                    localField: 'favoriteService.salonId',
                                    foreignField: '_id',
                                    as: 'favoriteService.salonData',
                                },
                            },
                            { $unwind: { path: '$favoriteService.salonData', preserveNullAndEmptyArrays: true } },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        const result: Services = { list: [], metaCounter: data[0].metaCounter };
        result.list = data[0].list.map((ele: T) => ele.favoriteService);
        return result;
    }
}