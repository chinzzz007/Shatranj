import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema()
export class User{
    @Prop({required: true, unique: true})
    username: string

    @Prop({required: true, unique: true})
    email: string

    @Prop({required: true})
    password: string

    @Prop({required: true})
    full_name: string

    @Prop()
    reset_otp: string

    @Prop()
    otp_expiry: Date
}

export const UserSchema = SchemaFactory.createForClass(User);