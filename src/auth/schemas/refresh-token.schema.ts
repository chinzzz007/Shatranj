import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

@Schema()
export class RefreshToken extends Document{
    @Prop({required: true})
    refresh_token:string

    @Prop({required: true})
    user_id: mongoose.Types.ObjectId

    @Prop({required: true})
    expiry_date: Date
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);