import { ObjectId } from "mongoose";

export interface T {
    [key: string]: any;
}

export interface StatisticModifier {
    _id: ObjectId;     //kerakli collectionning document idsi 
    targetKey: string; //kerakli qiymatni ozgartiramiz.yani nimani
    modifier: number;    //qanday qiymatga ozgartirmoqchimiz?
}