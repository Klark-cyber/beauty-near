import { Module } from '@nestjs/common';
import {InjectConnection, MongooseModule} from "@nestjs/mongoose";
import { Connection } from 'mongoose';
@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: () => ({ //ulanish linki develop yoki productiondan kelib chiqib tanlanadi.
                uri: process.env.NODE_ENV === "production" ? process.env.MONGO_PROD : process.env.MONGO_DEV,
            })
        })
    ],
    exports: [MongooseModule],
})
export class DatabaseModule {
    constructor(@InjectConnection() private readonly connection:Connection) {
        if(connection.readyState === 1){ //mongodb connect muvafaqqiyatli bolsa yani readyState = 1 bolsa
            console.log(`MongoDB is connected into ${process.env.NODE_ENV === "production" ? "production" : "development" } db`)
        } else {
            console.log(" DB is not connected!");
        }
    }
}
