import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { OrdinaryInquiry } from '../../libs/dto/salon/salon.input';
import { Salons } from '../../libs/dto/salon/salon';
import { ViewGroup } from '../../libs/enums/view.enum';

@Injectable()
export class ViewService {
    constructor(@InjectModel('View') private readonly viewModel: Model<View>) { }

    public async recordView(input: ViewInput): Promise<View | null> {
        const viewExist = await this.checkViewExistence(input);
        if (!viewExist) {
            console.log('- New View Insert -');
            return await this.viewModel.create(input);
        } else return null;
    }

    private async checkViewExistence(input: ViewInput): Promise<View | null> {
        const { memberId, viewRefId } = input;
        const search: T = { memberId: memberId, viewRefId: viewRefId };
        return await this.viewModel.findOne(search).exec();
    }

    // NESTAR: getVisitedProperties → BEAUTYNEAR: getVisitedSalons
    public async getVisitedSalons(memberId: ObjectId, input: OrdinaryInquiry): Promise<Salons> {
        const { page, limit } = input;
        const match: T = { viewGroup: ViewGroup.SALON, memberId: memberId };

        const data: T = await this.viewModel
            .aggregate([
                { $match: match },
                { $sort: { updatedAt: -1 } },
                {
                    $lookup: {
                        from: 'salons',
                        localField: 'viewRefId',
                        foreignField: '_id',
                        as: 'visitedSalon',
                    },
                },
                { $unwind: '$visitedSalon' },
                {
                    $facet: {
                        list: [
                            { $skip: (page - 1) * limit },
                            { $limit: limit },
                            {
                                $lookup: {
                                    from: 'members',
                                    localField: 'visitedSalon.memberId',
                                    foreignField: '_id',
                                    as: 'visitedSalon.memberData',
                                },
                            },
                            { $unwind: '$visitedSalon.memberData' },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        console.log('getVisitedSalons data:', data[0]);
        const result: Salons = { list: [], metaCounter: data[0].metaCounter };
        result.list = data[0].list.map((ele: T) => ele.visitedSalon);
        return result;
    }
}