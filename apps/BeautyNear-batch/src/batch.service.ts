import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'apps/BeautyNear-api/src/libs/dto/member/member';
import { Salon } from 'apps/BeautyNear-api/src/libs/dto/salon/salon';
import { MemberStatus, MemberType } from 'apps/BeautyNear-api/src/libs/enums/member.enum';
import { SalonStatus } from 'apps/BeautyNear-api/src/libs/enums/salon.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
  constructor(
    @InjectModel('Salon') private readonly salonModel: Model<Salon>,     // Property → Salon
    @InjectModel('Member') private readonly memberModel: Model<Member>,
  ) { }

  // Har kuni rank larni 0 ga qaytaradi — keyin qayta hisoblanadi
  public async batchRollback(): Promise<void> {
    await this.salonModel
      .updateMany(
        { salonStatus: SalonStatus.ACTIVE },
        { salonRank: 0 },
      )
      .exec();

    await this.memberModel
      .updateMany(
        {
          memberStatus: MemberStatus.ACTIVE,
          memberType: MemberType.AGENT,
        },
        { memberRank: 0 },
      )
      .exec();
  }

  // Top salonlarni hisoblaydi
  public async batchTopSalons(): Promise<void> {
    const salons: Salon[] = await this.salonModel
      .find({
        salonStatus: SalonStatus.ACTIVE,
        salonRank: 0,
      })
      .exec();

    const promisedList = salons.map(async (salon: Salon) => {
      const { _id, salonLikes, salonViews, salonComments, salonFollowers } = salon;
      // Rank formula: followers eng muhim, keyin likes, comments, views
      const rank =
        salonFollowers * 4 +
        salonLikes * 3 +
        salonComments * 2 +
        salonViews * 1;
      return await this.salonModel.findByIdAndUpdate(_id, { salonRank: rank });
    });

    await Promise.all(promisedList);
  }

  // Top agentlarni hisoblaydi
  public async batchTopAgents(): Promise<void> {
    const agents: Member[] = await this.memberModel
      .find({
        memberType: MemberType.AGENT,
        memberStatus: MemberStatus.ACTIVE,
        memberRank: 0,
      })
      .exec();

    const promisedList = agents.map(async (agent: Member) => {
      const { _id, memberSalons, memberLikes, memberArticles, memberViews, memberFollowers } = agent;
      // NESTAR: memberProperties → memberSalons
      const rank =
        memberSalons * 5 +
        memberFollowers * 4 +
        memberArticles * 3 +
        memberLikes * 2 +
        memberViews * 1;
      return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
    });

    await Promise.all(promisedList);
  }

  public getHello(): string {
    return 'Welcome to BeautyNear BATCH Server!';
  }
}