import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServiceService } from './service.service';
import { Service, Services } from '../../libs/dto/service/service';
import { AgentServicesInquiry, AllServicesInquiry, ServiceInput, ServicesInquiry } from '../../libs/dto/service/service.input';
import { OrdinaryInquiry } from '../../libs/dto/salon/salon.input';
import { ServiceUpdate } from '../../libs/dto/service/service.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver()
export class ServiceResolver {
	constructor(private readonly serviceService: ServiceService) { }

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Service)
	public async createService(
		@Args('input') input: ServiceInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Service> {
		console.log('Mutation: createService');
		input.memberId = memberId;
		return await this.serviceService.createService(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Service)
	public async getService(
		@Args('serviceId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Service> {
		console.log('Query: getService');
		const serviceId = shapeIntoMongoObjectId(input);
		return await this.serviceService.getService(memberId, serviceId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Service)
	public async updateService(
		@Args('input') input: ServiceUpdate,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Service> {
		console.log('Mutation: updateService');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.serviceService.updateService(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Services)
	public async getServices(
		@Args('input') input: ServicesInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Services> {
		console.log('Query: getServices');
		return await this.serviceService.getServices(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Services)
	public async getAgentServices(
		@Args('input') input: AgentServicesInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Services> {
		console.log('Query: getAgentServices');
		return await this.serviceService.getAgentServices(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Services)
	public async getAllServicesByAdmin(
		@Args('input') input: AllServicesInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Services> {
		console.log('Query: getAllServicesByAdmin');
		return await this.serviceService.getAllServicesByAdmin(input);
	}

	// USER: like bosgan servicelarni oladi
	@UseGuards(AuthGuard)
	@Query(() => Services)
	public async getFavoriteServices(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Services> {
		console.log('Query: getFavoriteServices');
		return await this.serviceService.getFavoriteServices(memberId, input);
	}

	// USER: ko'rgan servicelarini oladi
	@UseGuards(AuthGuard)
	@Query(() => Services)
	public async getVisitedServices(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Services> {
		console.log('Query: getVisitedServices');
		return await this.serviceService.getVisitedServices(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Service)
	public async likeTargetService(
		@Args('serviceId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Service> {
		console.log('Mutation: likeTargetService');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.serviceService.likeTargetService(memberId, likeRefId);
	}

	/* ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Service)
	public async updateServiceByAdmin(@Args('input') input: ServiceUpdate): Promise<Service> {
		console.log('Mutation: updateServiceByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.serviceService.updateServiceByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Service)
	public async removeServiceByAdmin(@Args('serviceId') input: string): Promise<Service> {
		console.log('Mutation: removeServiceByAdmin');
		const serviceId = shapeIntoMongoObjectId(input);
		return await this.serviceService.removeServiceByAdmin(serviceId);
	}
}