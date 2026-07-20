import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { NotificationStatus } from '../../libs/enums/notification.enum';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class NotificationService {
    constructor(@InjectModel('Notification') private readonly notificationModel: Model<Notification>) { }

    // Foydalanuvchining o'z bildirishnomalari ro'yxati (eng yangisi tepada)
    public async getNotifications(memberId: ObjectId, input: NotificationsInquiry): Promise<Notifications> {
        const { page, limit, search } = input;
        const match: T = { receiverId: memberId };
        if (search?.notificationStatus) match.notificationStatus = search.notificationStatus;

        const result = await this.notificationModel
            .aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        list: [
                            { $skip: (page - 1) * limit },
                            { $limit: limit },
                            // ⚠️ YANGI — avval faqat authorId (xom ID) qaytardi,
                            // kim like/follow qilganini ko'rsatish uchun UNING
                            // ismi/rasmi kerak edi ("chala" ko'rinishning sababi shu)
                            {
                                $lookup: {
                                    from: 'members',
                                    localField: 'authorId',
                                    foreignField: '_id',
                                    as: 'authorData',
                                },
                            },
                            { $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result[0];
    }

    // Qo'ng'iroqcha ustidagi qizil son uchun — o'qilmagan sonini tez qaytaradi
    public async getUnreadCount(memberId: ObjectId): Promise<number> {
        return this.notificationModel.countDocuments({ receiverId: memberId, notificationStatus: NotificationStatus.WAIT }).exec();
    }

    // Bitta bildirishnomani "o'qildi" deb belgilash (bosilganda)
    public async markAsRead(memberId: ObjectId, notificationId: ObjectId): Promise<Notification> {
        const result = await this.notificationModel
            .findOneAndUpdate(
                { _id: notificationId, receiverId: memberId },
                { notificationStatus: NotificationStatus.READ },
                { new: true },
            )
            .exec();
        if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result;
    }

    // Barchasini bir vaqtda "o'qildi" deb belgilash
    public async markAllAsRead(memberId: ObjectId): Promise<boolean> {
        await this.notificationModel
            .updateMany({ receiverId: memberId, notificationStatus: NotificationStatus.WAIT }, { notificationStatus: NotificationStatus.READ })
            .exec();
        return true;
    }
}