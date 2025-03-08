import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Mongoose } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {v4 as uuidv4} from 'uuid';
import { RefreshToken } from './schemas/refresh-token.schema';  
import {UserTokens} from './interfaces/user-tokens.interface'


@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private UserModel: Model<User>,
        @InjectModel(RefreshToken.name) private RefreshTokenModel: Model<RefreshToken>,
        private jwtService: JwtService
    ) {}

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

    async signin(signInData: SignInDto): Promise<UserTokens>{
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

        // Generate JWT tokens
        return this.generateUserTokens(user._id);
    }

    async generateUserTokens(user_id: mongoose.Types.ObjectId): Promise<UserTokens>{
        // generating accessToken 
        const access_token = this.jwtService.sign({user_id}, {expiresIn: '3d'});
        const refresh_token = uuidv4();
        await this.storeRefreshToken(refresh_token, user_id);
        return {
            access_token,
            refresh_token
        }
    }

    async storeRefreshToken(refresh_token: string, user_id: Object){
        const expiry_date = new Date();
        expiry_date.setDate(expiry_date.getDate() + 7);

        // storing refresh token in refreshtokens collection
        await this.RefreshTokenModel.updateOne (
            {user_id},
            {$set: {refresh_token, expiry_date}},
            {upsert: true}
        );
    }

    async refreshTokens(token: string){
        const stored_token = await this.RefreshTokenModel.findOne({
            refresh_token: token,
            expiry_date: {$gte: new Date()}
        })

        if(!stored_token){
            throw new UnauthorizedException('Please SignIn again');
        }

        return this.generateUserTokens(stored_token.user_id);
    }
}