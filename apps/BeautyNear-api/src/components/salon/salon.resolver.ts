import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Salon, Salons } from '../../libs/dto/salon/salon';
import { AgentSalonsInquiry, AllSalonsInquiry, OrdinaryInquiry, SalonInput, SalonsInquiry } from '../../libs/dto/salon/salon.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { SalonUpdate } from '../../libs/dto/salon/salon.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { SalonService } from './salon.service';

@Resolver()
export class SalonResolver {
  constructor(private readonly salonService: SalonService) { }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Salon)
  public async createSalon(
    @Args('input') input: SalonInput,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<Salon> {
    console.log('Mutation: createSalon');
    input.memberId = memberId;
    return await this.salonService.createSalon(input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Salon)
  public async getSalon(
    @Args('salonId') input: string,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<Salon> {
    console.log('Query: getSalon');
    const salonId = shapeIntoMongoObjectId(input);
    return await this.salonService.getSalon(memberId, salonId);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Salon)
  public async updateSalon(
    @Args('input') input: SalonUpdate,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<Salon> {
    console.log('Mutation: updateSalon');
    input._id = shapeIntoMongoObjectId(input._id);
    return await this.salonService.updateSalon(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Salons)
  public async getSalons(
    @Args('input') input: SalonsInquiry,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<Salons> {
    console.log('Query: getSalons');
    return await this.salonService.getSalons(memberId, input);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => Salons)
  public async getAgentSalons(
    @Args('input') input: AgentSalonsInquiry,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<Salons> {
    console.log('Query: getAgentSalons');
    return await this.salonService.getAgentSalons(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Salons)
  public async getFavoriteSalons(
    @Args('input') input: OrdinaryInquiry,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<Salons> {
    console.log('Query: getFavoriteSalons');
    return await this.salonService.getFavoriteSalons(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Salons)
  public async getVisitedSalons(
    @Args('input') input: OrdinaryInquiry,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<Salons> {
    console.log('Query: getVisitedSalons');
    return await this.salonService.getVisitedSalons(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Salon)
  public async likeTargetSalon(
    @Args('salonId') input: string,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<Salon> {
    console.log('Mutation: likeTargetSalon');
    const likeRefId = shapeIntoMongoObjectId(input);
    return await this.salonService.likeTargetSalon(memberId, likeRefId);
  }

  // AGENT: aksiya e'lon qiladi → followchilarga notification
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Boolean)
  public async announceDiscount(
    @Args('salonId') input: string,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<boolean> {
    console.log('Mutation: announceDiscount');
    const salonId = shapeIntoMongoObjectId(input);
    await this.salonService.announceDiscount(memberId, salonId);
    return true;
  }

  // AGENT: bugun bo'sh vaqt borligini e'lon qiladi → followchilarga notification
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Boolean)
  public async announceFreeSlot(
    @Args('salonId') input: string,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<boolean> {
    console.log('Mutation: announceFreeSlot');
    const salonId = shapeIntoMongoObjectId(input);
    await this.salonService.announceFreeSlot(memberId, salonId);
    return true;
  }

  /* ADMIN */

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Salons)
  public async getAllSalonsByAdmin(
    @Args('input') input: AllSalonsInquiry,
    @AuthMember('_id') memberId: mongoose.ObjectId,
  ): Promise<Salons> {
    console.log('Query: getAllSalonsByAdmin');
    return await this.salonService.getAllSalonsByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Salon)
  public async updateSalonByAdmin(@Args('input') input: SalonUpdate): Promise<Salon> {
    console.log('Mutation: updateSalonByAdmin');
    input._id = shapeIntoMongoObjectId(input._id);
    return await this.salonService.updateSalonByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Salon)
  public async removeSalonByAdmin(@Args('salonId') input: string): Promise<Salon> {
    console.log('Mutation: removeSalonByAdmin');
    const salonId = shapeIntoMongoObjectId(input);
    return await this.salonService.removeSalonByAdmin(salonId);
  }
}