import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FollowService } from './follow.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Follower, Followers, Followings } from '../../libs/dto/follow/follow';
import { FollowInquiry, FollowToggleInput } from '../../libs/dto/follow/follow.input';

@Resolver()
export class FollowResolver {
    constructor(private readonly followService: FollowService) { }

    @UseGuards(AuthGuard)
    @Mutation(() => Follower)
    public async subscribe(
        @Args('input') input: FollowToggleInput,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Follower> {
        console.log('Mutation: subscribe');
        return await this.followService.subscribe(memberId, input);
    }

    @UseGuards(AuthGuard)
    @Mutation(() => Follower)
    public async unsubscribe(
        @Args('input') input: FollowToggleInput,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Follower> {
        console.log('Mutation: unsubscribe');
        return await this.followService.unsubscribe(memberId, input);
    }

    @UseGuards(WithoutGuard)
    @Query(() => Followings)
    public async getMemberFollowings(
        @Args('input') input: FollowInquiry,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Followings> {
        console.log('Query: getMemberFollowings');
        return await this.followService.getMemberFollowings(memberId, input);
    }

    @UseGuards(WithoutGuard)
    @Query(() => Followers)
    public async getMemberFollowers(
        @Args('input') input: FollowInquiry,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Followers> {
        console.log('Query: getMemberFollowers');
        return await this.followService.getMemberFollowers(memberId, input);
    }
}