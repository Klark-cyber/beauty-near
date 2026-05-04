import {ObjectId} from "bson"

export const availableAgentSorts = ["createdAt", "updatedAt", "memberLikes", "memberViews", "memberRank"]; //user agentlarni sort qiladi
export const availableMemberSorts = ["createdAt", "updatedAt", "memberLikes", "memberViews"]; //admin jami userlarni sort qiladi

export const availableOptions = ['propertyBarter', 'propertyRent'];
export const availablePropertySorts = [
 'createdAt',
 'updatedAt',
 'propertyLikes',
 'propertyViews',
 'propertyRank',
 'propertyPrice',
];

export const availableCommentSorts = ["createdAt", "updatedAt"]

export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews']
 // IMAGE CONFIGURATION (config.js)
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from "./types/common";

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

export const shapeIntoMongoObjectId = (target:any) => {
    return typeof target === "string" ? new ObjectId(target) : target;
};

export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => { //memberId murojaatchi idsi, targetRefId propertylar idsi.Agar lookuMemberLked coll bolganda property idsi kiritilmasa defolt skip va limit natijasida hosil bolgan propertylar idsini qabul qiladi
    return {
        $lookup: {
            from: 'likes',
            let:{ //local variaablesni hosil qildik va bu lookup process ichida tashkillashtiriladisearch mexanizmi uchun
                localLikeRefId: targetRefId,
                localMemberId: memberId,
                localMyFavorite: true, //ozmoz uchun qiymat
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [{$eq:["$likeRefId", "$$localLikeRefId"] }, {$eq:["$memberId", "$$localMemberId" ]}],  //. ,$eq ichiga solishtiriladigan mantiq yoziladi, $$ 2 bolishiga sabab bu local varieble.
                        },
                    },
                },
                {
                    $project: { //projectni getProperties Properties ni return qiladi, Properties DTO esa Propertylardan iborat array qaytaradi, Property ichida esa MeLiked[] mantigi bor meLiked ichida soralgan qiymatlar: memberId, likeRefId, myFavorite: booleandir
                        _id: 0, //idni olib bermasin.id doim defolt 1 ga teng boladi 0 yozish orqali bizga kerak emas demoqchimiz.
                        memberId: 1, //memberId kerak uni 1 qildik.id dan boshqa barcha qiymatlar defaiult 0 boladi shu sababli uni 1 qilib tanlab oldik
                        likeRefId: 1,
                        myFavorite: '$$localMyFavorite',
                    }
                }
            ],
            as: "meLiked",
 },
    }
};

interface LookupAuthMemberFollowed {
    followerId:T;
    followingId: string; //followingId followModeldan query natijasida hosil bolgan followingId va buni objectId ga otkazmasdan togridan togri lookupAuthMemberFollowedga path qildik
}

export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => { //memberId murojaatchi idsi, targetRefId propertylar idsi.Agar lookuMemberLked coll bolganda property idsi kiritilmasa defolt skip va limit natijasida hosil bolgan propertylar idsini qabul qiladi
   const {followerId, followingId} = input;
    return {
        $lookup: {
            from: 'follows',
            let:{ //local variaablesni hosil qildik va bu lookup process ichida tashkillashtiriladisearch mexanizmi uchun
                localFollowerId: followerId,
                localFollowingId: followingId,
                localMyFavorite: true, //ozmiz uchun qiymat buni qiymati MeFollowed[] ichida mavjud uning haqiqiy qiymati shu yerda belgilanadi
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [{$eq:["$followerId", "$$localFollowerId"] }, {$eq:["$followingId", "$$localFollowingId" ]}],  //. ,$eq ichiga solishtiriladigan mantiq yoziladi, $$ 2 bolishiga sabab bu local varieble.
                        },
                    },
                },
                {
                    $project: { //projectni getProperties Properties ni return qiladi, Properties DTO esa Propertylardan iborat array qaytaradi, Property ichida esa MeLiked[] mantigi bor meLiked ichida soralgan qiymatlar: memberId, likeRefId, myFavorite: booleandir
                        _id: 0, //idni olib bermasin.id doim defolt 1 ga teng boladi 0 yozish orqali bizga kerak emas demoqchimiz.
                        followerId: 1, //followerId kerak uni 1 qildik.id dan boshqa barcha qiymatlar defaiult 0 boladi shu sababli uni 1 qilib tanlab oldik
                        followingId: 1,
                        myFollowing: '$$localMyFavorite',
                    }
                }
            ],
            as: "meFollowed",
 },
    }
};

export const lookupMember = [
 {
  $lookup: {
   from: 'members',
   localField: 'memberId',
   foreignField: '_id',
   as: 'memberData',
  },
 },
];

export const lookupFollowingData = {
 $lookup: {
  from: 'members',
  localField: 'followingId',
  foreignField: '_id',
  as: 'followingData',
 },
};

export const lookupFollowerData = {
 $lookup: {
  from: 'members',
  localField: 'followerId',
  foreignField: '_id',
  as: 'followerData',
 },
};

export const lookupFavorite = {
 $lookup: {
  from: 'members',
  localField: 'favoriteProperty.memberId',
  foreignField: '_id',
  as: 'favoriteProperty.memberData',
 },
};

export const lookupVisit = {
 $lookup: {
  from: 'members',
  localField: 'visitedProperty.memberId',
  foreignField: '_id',
  as: 'visitedProperty.memberData',
 },
};