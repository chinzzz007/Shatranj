import { BadRequestException, Injectable, Logger, Req, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ChangePasswordDto } from './dto/changePassword.dto';
import * as bcrypt from 'bcrypt';
import { ReturnResponse } from 'src/auth/interfaces/return-response.interface';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async changePassword(changePasswordData: ChangePasswordDto, user_id: ObjectId): Promise<ReturnResponse>{
        try{
            const {old_password, new_password} = changePasswordData;
            const existingUser = await this.userModel.findOne({_id: user_id});

            if(!existingUser){
                throw new UnauthorizedException({
                    success: false,
                    status_code: 401,
                    message: 'User not found please signup'
                });
            }

            // comparing the passwords
            const passwordMatch = await bcrypt.compare(old_password, existingUser.password);
            if(!passwordMatch){
                throw new BadRequestException({
                    success: false,
                    status_code: 400,
                    message: "Invalid credentials!"
                })
            }

            const new_hashed_password = await bcrypt.hash(new_password, 10);

            const newUser = await this.userModel.updateOne(
                {_id: user_id},
                {$set: {password: new_hashed_password}}
            );

            return {
                success: true,
                status_code: 200,
                message: "Password changed successfully!"
            }
        }
        catch(error){
            throw error;
        }
    }
}
