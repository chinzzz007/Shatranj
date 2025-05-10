import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { OtpRecords } from '../schemas/otp-records.schema';

@Injectable()
export class AuthCronsService {
    constructor(@InjectModel(OtpRecords.name) private otpRecordsModel: Model<OtpRecords>){}

    // Removing all the expired otp records every sunday
    @Cron('0 0 * * 0')
    async cleanExpiredOtps(){
        console.log("Running OTP cleanup job at: ", new Date());

        const result = await this.otpRecordsModel.deleteMany(
            {expiry_time: {$lt : new Date()}}
        )

        console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    }
}
