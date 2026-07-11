import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FaqService } from './faq.service';
import { UseGuards } from '@nestjs/common';
import { WithoutGuard } from '../auth/guards/without.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Faq, Faqs } from '../../libs/dto/faq/faq';
import { AllFaqsInquiry, FaqInput, FaqsInquiry } from '../../libs/dto/faq/faq.input';
import { FaqUpdate } from '../../libs/dto/faq/faq.update';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class FaqResolver {
	constructor(private readonly faqService: FaqService) { }

	@UseGuards(WithoutGuard)
	@Query(() => Faqs)
	public async getFaqs(@Args('input') input: FaqsInquiry): Promise<Faqs> {
		console.log('Query: getFaqs');
		return await this.faqService.getFaqs(input);
	}

	/* ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Faq)
	public async createFaqByAdmin(@Args('input') input: FaqInput): Promise<Faq> {
		console.log('Mutation: createFaqByAdmin');
		return await this.faqService.createFaq(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Faq)
	public async updateFaqByAdmin(@Args('input') input: FaqUpdate): Promise<Faq> {
		console.log('Mutation: updateFaqByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.faqService.updateFaq(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Faqs)
	public async getAllFaqsByAdmin(@Args('input') input: AllFaqsInquiry): Promise<Faqs> {
		console.log('Query: getAllFaqsByAdmin');
		return await this.faqService.getAllFaqsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Faq)
	public async removeFaqByAdmin(@Args('faqId') input: string): Promise<Faq> {
		console.log('Mutation: removeFaqByAdmin');
		const faqId = shapeIntoMongoObjectId(input);
		return await this.faqService.removeFaqByAdmin(faqId);
	}
}
