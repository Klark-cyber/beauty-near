import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Service, Services } from '../../libs/dto/service/service';
import { Direction } from '../../libs/enums/common.enum';
import { Message } from '../../libs/enums/common.enum';
import { AgentServicesInquiry, AllServicesInquiry, ServiceInput, ServicesInquiry } from '../../libs/dto/service/service.input';
import { ServiceUpdate } from '../../libs/dto/service/service.update';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { ServiceStatus } from '../../libs/enums/service.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { lookupAuthMemberLiked, lookupMember, lookupSalon, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class ServiceService {
    constructor(
        @InjectModel('Service') private readonly serviceModel: Model<Service>,
        @InjectModel('Salon') private readonly salonModel: Model<any>,
        private readonly memberService: MemberService,
        private readonly viewService: ViewService,
        private readonly likeService: LikeService,
    ) { }

    public async createService(input: ServiceInput): Promise<Service> {
        try {
            const result = await this.serviceModel.create(input);
            return result;
        } catch (err) {
            console.log('Error, Service.model:', err.message);
            throw new BadRequestException(Message.CREATE_FAILED);
        }
    }

    public async getService(memberId: ObjectId | null, serviceId: ObjectId): Promise<Service> {
        // ⚠️ TUZATILDI: avval FAQAT "ACTIVE" xizmatlarni qaytarardi — bu
        // to'g'ri (mijozlar faqat faol xizmatlarni ko'rishi kerak), LEKIN
        // agent o'zining INACTIVE xizmatini TAHRIRLAMOQCHI bo'lganda ham
        // shu cheklov ishlab, forma bo'sh qolib ketardi. Endi: agar
        // so'rovchi shu xizmat EGASI bo'lsa, status qanday bo'lishidan
        // qat'iy nazar ko'rsatiladi; aks holda faqat ACTIVE.
        const ownerCheck = memberId ? await this.serviceModel.findOne({ _id: serviceId, memberId }).lean().exec() : null;
        const search: T = ownerCheck ? { _id: serviceId } : { _id: serviceId, serviceStatus: ServiceStatus.ACTIVE };

        const targetService = await this.serviceModel.findOne(search).lean().exec();
        if (!targetService) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        if (memberId) {
            const viewInput = { memberId: memberId, viewRefId: serviceId, viewGroup: ViewGroup.SERVICE };
            const newView = await this.viewService.recordView(viewInput);
            if (newView) {
                await this.serviceStatsEditor({ _id: serviceId, targetKey: 'serviceViews', modifier: 1 });
                targetService.serviceViews++;
            }

            const likeInput = { memberId: memberId, likeRefId: serviceId, likeGroup: LikeGroup.SERVICE };
            targetService.meLiked = (await this.likeService.checkLikeExistence(likeInput)) as any;
        }

        targetService.memberData = (await this.memberService.getMember(null, targetService.memberId)) as any;
        return targetService;
    }

    public async updateService(memberId: ObjectId, input: ServiceUpdate): Promise<Service> {
        const { serviceStatus } = input as any;
        // ⚠️ TUZATILDI: Salon bilan bir xil xato — faqat ACTIVE xizmatlarni
        // yangilashga ruxsat berardi, INACTIVE xizmatni qayta faollashtirish
        // yoki o'chirishni bloklardi.
        const search: T = { _id: input._id, memberId: memberId, serviceStatus: { $ne: ServiceStatus.DELETE } };

        if (serviceStatus === ServiceStatus.DELETE) input.deletedAt = new Date();

        const result = await this.serviceModel.findOneAndUpdate(search, input, { new: true }).exec();
        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        return result;
    }

    public async getServices(memberId: ObjectId, input: ServicesInquiry): Promise<Services> {
        const match: T = { serviceStatus: ServiceStatus.ACTIVE };
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        this.shapeMatchQuery(match, input);

        // ⚠️ TUZATILDI: Service'ning o'zida location maydoni yo'q — u
        // salonga tegishli. Avval shu locationList'ga mos salonlarni
        // topib, keyin faqat o'sha salonlarga tegishli servicelarni
        // filtrlaymiz.
        const { locationList } = input.search;
        if (locationList && locationList.length > 0) {
            const matchingSalons = await this.salonModel
                .find({ salonLocation: { $in: locationList } })
                .select('_id')
                .exec();
            const salonIds = matchingSalons.map((s) => s._id);
            // Agar allaqachon salonId bo'yicha filtr bo'lsa, ikkalasini kesishtiramiz
            if (match.salonId) {
                const alreadyMatches = salonIds.some((id) => id.toString() === match.salonId.toString());
                match.salonId = alreadyMatches ? match.salonId : { $in: [] }; // hech biriga mos kelmasa — bo'sh natija
            } else {
                match.salonId = { $in: salonIds };
            }
        }

        console.log('match:', match);

        const result = await this.serviceModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            lookupAuthMemberLiked(memberId),
                            ...lookupMember,
                            { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
                            ...lookupSalon,
                            { $unwind: { path: '$salonData', preserveNullAndEmptyArrays: true } },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result[0];
    }

    private shapeMatchQuery(match: T, input: ServicesInquiry): void {
        const { memberId, salonId, typeList, priceMin, priceMax, durationMax, text } = input.search;

        if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
        if (salonId) match.salonId = shapeIntoMongoObjectId(salonId);
        if (typeList) match.serviceType = { $in: typeList };
        if (priceMin !== undefined || priceMax !== undefined) {
            match.servicePrice = {};
            if (priceMin !== undefined) match.servicePrice.$gte = priceMin;
            if (priceMax !== undefined) match.servicePrice.$lte = priceMax;
        }
        if (durationMax) match.serviceDuration = { $lte: durationMax };
        if (text) match.serviceTitle = { $regex: new RegExp(text, 'i') };
    }

    public async getAgentServices(memberId: ObjectId, input: AgentServicesInquiry): Promise<Services> {
        const { serviceStatus } = input.search;
        if (serviceStatus === ServiceStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

        const match: T = {
            memberId: memberId,
            serviceStatus: serviceStatus ?? { $ne: ServiceStatus.DELETE },
        };
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        const result = await this.serviceModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            ...lookupSalon,
                            { $unwind: { path: '$salonData', preserveNullAndEmptyArrays: true } },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result[0];
    }

    public async getAllServicesByAdmin(input: AllServicesInquiry): Promise<Services> {
        const { serviceStatus, typeList } = input.search;
        const match: T = {};
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        if (serviceStatus) match.serviceStatus = serviceStatus;
        if (typeList) match.serviceType = { $in: typeList };

        const result = await this.serviceModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            ...lookupMember,
                            // ⚠️ TUZATILDI: avval $unwind moslik topilmasa
                            // BUTUN hujjatni natijadan olib tashlar edi —
                            // shuning uchun member/salon topilmagan
                            // servicelar (yoki barchasi) butunlay
                            // ko'rinmay qolar edi. preserveNullAndEmptyArrays
                            // bilan endi hujjat saqlanadi, faqat mos
                            // maydon bo'sh (null) bo'lib qoladi.
                            { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
                            ...lookupSalon,
                            { $unwind: { path: '$salonData', preserveNullAndEmptyArrays: true } },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result[0];

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result[0];
    }

    public async getFavoriteServices(memberId: ObjectId, input: any): Promise<Services> {
        return await this.likeService.getFavoriteServices(memberId, input);
    }

    public async getVisitedServices(memberId: ObjectId, input: any): Promise<Services> {
        return await this.viewService.getVisitedServices(memberId, input);
    }

    public async likeTargetService(memberId: ObjectId, likeRefId: ObjectId): Promise<Service> {
        const target = await this.serviceModel
            .findOne({ _id: likeRefId, serviceStatus: ServiceStatus.ACTIVE })
            .exec() as Service;
        if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        const input: LikeInput = {
            memberId: memberId,
            likeRefId: likeRefId,
            likeGroup: LikeGroup.SERVICE,
        };

        const modifier: number = await this.likeService.toggleLike(input);
        const result = await this.serviceStatsEditor({ _id: likeRefId, targetKey: 'serviceLikes', modifier: modifier });

        if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
        return result;
    }

    /* ADMIN */

    public async updateServiceByAdmin(input: ServiceUpdate): Promise<Service> {
        const { serviceStatus } = input as any;
        const search: T = { _id: input._id, serviceStatus: ServiceStatus.ACTIVE };

        if (serviceStatus === ServiceStatus.DELETE) input.deletedAt = new Date();

        const result = await this.serviceModel.findOneAndUpdate(search, input, { new: true }).exec();
        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        return result;
    }

    public async removeServiceByAdmin(serviceId: ObjectId): Promise<Service> {
        const search: T = { _id: serviceId, serviceStatus: ServiceStatus.DELETE };
        const result = await this.serviceModel.findOneAndDelete(search).exec();
        if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
        return result;
    }

    public async serviceStatsEditor(input: StatisticModifier): Promise<Service | null> {
        const { _id, targetKey, modifier } = input;
        return await this.serviceModel
            .findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
            .exec();
    }
}