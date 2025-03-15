import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class OtpRecords extends Document {
    @Prop({required: true})
    email: string

    @Prop({required: true})
    otp: string

    @Prop({required: true})
    expiry_time: Date

    @Prop()
    temp_uuid: string

    @Prop()
    uuid_expiry: Date
}

export const OtpRecordsSchema = SchemaFactory.createForClass(OtpRecords);