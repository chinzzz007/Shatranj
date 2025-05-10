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
    
    @Prop({index: true})
    refresh_token: string

    @Prop()
    expiry_date: Date
}

export const UserSchema = SchemaFactory.createForClass(User);