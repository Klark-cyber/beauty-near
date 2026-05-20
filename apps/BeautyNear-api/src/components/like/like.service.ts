import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';
import { OrdinaryInquiry } from '../../libs/dto/salon/salon.input';
import { Salons } from '../../libs/dto/salon/salon';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class LikeService {
    constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) { }

    public async toggleLike(input: LikeInput): Promise<number> {
        const search: T = { memberId: input.memberId, likeRefId: input.likeRefId };
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
        const { memberId, likeRefId } = input;
        const result = await this.likeModel.findOne({ memberId: memberId, likeRefId: likeRefId }).exec();
        return result ? [{ memberId: memberId, likeRefId: likeRefId, myFavorite: true }] : [];
    }

    // NESTAR: getFavoriteProperties → BEAUTYNEAR: getFavoriteSalons
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
                { $unwind: '$favoriteSalon' },
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
                            { $unwind: '$favoriteSalon.memberData' },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        console.log('getFavoriteSalons data:', data[0]);
        const result: Salons = { list: [], metaCounter: data[0].metaCounter };
        result.list = data[0].list.map((ele: T) => ele.favoriteSalon);
        return result;
    }
}