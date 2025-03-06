import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/signin.dto';

interface ApiResponse {
    status: boolean;
    message: string;
}

@Injectable()
export class AuthService {
    constructor(@InjectModel(User.name) private UserModel: Model<User>) {}

    async signup(signUpData: SignUpDto): Promise<User>{
        const {email, username, password, full_name} = signUpData;
        
        // Checking for existence of mail in the database
        const emailInUse = await this.UserModel.findOne({
            email: email,
        })
        if(emailInUse){
            throw new BadRequestException('Email Already in use!')
        }

        // Checking for the existence of username in the database
        const usernameInUse = await this.UserModel.findOne({
            username: username,
        })
        if(usernameInUse){
            throw new BadRequestException('Username Already in use!')
        }

        // Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Creating User document and saving in mongodb
        const createdUser = await this.UserModel.create({
            email: email,
            username: username,
            password: hashedPassword, 
            full_name: full_name
        })
        
        return createdUser; 
    }

    async signin(signInData: SignInDto): Promise<ApiResponse>{
        const {email, username, password} = signInData;

        // Finding user for the provided mail & username
        const user = await this.UserModel.findOne({
            email: email, 
            username: username
        })

        if(!user) {
            throw new UnauthorizedException('Invalid Credentials!')
        }

        // Comparison of password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if(!passwordMatch){
            throw new UnauthorizedException('Invalid Credentials');
        }

        return{
            status: true,
            message: 'Success'
        }
    }


}