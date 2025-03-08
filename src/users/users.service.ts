import { BadRequestException, Injectable, Logger, Req, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ChangePasswordDto } from './dto/changePassword.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async changePassword(changePasswordData: ChangePasswordDto, req){
        const {old_password, new_password} = changePasswordData;
        const user_id = req.user_id;
        const existingUser = await this.userModel.findOne({_id: user_id});

        if(!existingUser){
            throw new UnauthorizedException('User not found please signup');
        }

        // comparing the passwords
        const passwordMatch = await bcrypt.compare(old_password, existingUser.password);
        if(!passwordMatch){
            throw new BadRequestException('Invalid credentials!')
        }

        const new_hashed_password = await bcrypt.hash(new_password, 10);

        const newUser = await this.userModel.updateOne(
            {_id: user_id},
            {$set: {password: new_hashed_password}}
        );
    }
}
