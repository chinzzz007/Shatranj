import { BadRequestException, Injectable, Req, UnauthorizedException, UnsupportedMediaTypeException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Mongoose } from 'mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {v4 as uuidv4} from 'uuid';
import { RefreshToken } from './schemas/refresh-token.schema';  
import {UserTokens} from './interfaces/user-tokens.interface'
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { ReturnResponse } from './interfaces/return-response.interface';
import { OtpFromClientDto } from './dto/otpFromClient.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private UserModel: Model<User>,
        @InjectModel(RefreshToken.name) private RefreshTokenModel: Model<RefreshToken>,
        private jwtService: JwtService,
        private readonly mailService: MailerService
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
            {user_id: user_id},
            {$set: {
                refresh_token: refresh_token, 
                expiry_date: expiry_date
            }},
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

    async forgotPasswordOtpToClient(forgotPasswordProvidedData : ForgotPasswordDto):Promise<ReturnResponse>{ 
        const {email} = forgotPasswordProvidedData;

        try{
            // Checking for the existence of the provided email
            const existingUser = await this.UserModel.findOne({
                email: email
            })
            if(!existingUser){
                throw new UnauthorizedException('User doesnt exist');
            }

            // If email is present generating and storing an otp in user docs 
            const resetOtp = await this.generateAndStoreOtp(existingUser);

            // Now sending an email to the registered email
            await this.sendMail(email, resetOtp);

            return{
                success: true,
                status_code: 200,
                message: 'Email sent successfully!'
            }
        }
        catch(error){
            return{
                success: false,
                status_code: 500,
                message: 'Unable to send email',
                error: error.message
            }
        }
    }

    async generateAndStoreOtp(existingUser: UserDocument): Promise<string>{
        // creating a 6-digit otp and hashing it to store it in db
        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(resetOtp, 10);

        // creating expiry time for otp - 5 minutes
        const expiry_time = new Date(Date.now() + 5*60*1000);
        
        existingUser.reset_otp = hashedOtp;
        existingUser.otp_expiry = expiry_time;

        await existingUser.save();

        return resetOtp;
    }

    async sendMail(email: string, resetOtp: string): Promise<ReturnResponse>{
        const message = `Here is your Otp: ${resetOtp}. This will expire in 5 minutes.`;
        try{
            this.mailService.sendMail({
                from: `Shatranj<chinz.cm7@gmail.com>`,
                to: email,
                subject: 'Otp for Reseting Your Password',
                text: message    
            })

            return{
                success: true,
                status_code: 200,
                message: 'Email sent successfully!'
            }
        } catch(error){
            return{
                success: false,
                status_code: 500,
                message: 'Unable to send email',
                error: error.message
            }
        }
    }

    async setPasswordToken(user_id: Object): Promise<string>{
        return this.jwtService.sign({user_id: user_id}, {expiresIn: '15m'});
    }

    async forgotPasswordOtpFromClient(otpFromClientData: OtpFromClientDto): Promise<ReturnResponse>{
        try{
            const {resetOtp, email} = otpFromClientData;
            
            const existingUser = await this.UserModel.findOne({
                email: email
            })
            if(!existingUser){
                throw new UnauthorizedException('User doesnt exist');
            }

            if(!existingUser.otp_expiry || !existingUser.reset_otp){
                throw new Error('Invalid Otp');
            }

            // If provided otp is expired
            if(existingUser.otp_expiry < new Date()){
                throw new Error('Otp Expired');
            }

            // Comparing the hashed otps
            const isMatch = await bcrypt.compare(resetOtp, existingUser.reset_otp);

            if(!isMatch){
                throw new Error('Invalid Otp!');
            }

            await this.UserModel.updateOne(
                {email: email},
                {$unset: {reset_otp: "", otp_expiry: ""}}
            )

            const shortJWT = await this.setPasswordToken(existingUser._id);
            
            return{
                success: true,
                status_code: 200,
                message: 'You can change your password!',
                short_lived_token: shortJWT
            }
        }
        catch(error){
            return{
                success: false,
                status_code: 500,
                message: 'Unable to verify otp',
                error: error.message
            }
        }
    }

    async forgotPasswordResetPassword(resetPasswordData: ResetPasswordDto, req){
        const {reset_password, confirm_reset_password} = resetPasswordData;
        const user_id = req.user_id;
        
        if(reset_password != confirm_reset_password){
            throw new Error("Passwords aren't matching!");
        }

        const existingUser = await this.UserModel.findOne({
            _id: user_id
        })
        if(!existingUser){
            throw new UnauthorizedException('User doesnt exist');
        }

        const hashedPassword = bcrypt.hash(reset_password, 10);
        const updatedPasswordUser = await this.UserModel.updateOne(
            {_id: user_id},
            {
                $set:{
                    password: hashedPassword,
                }
            }
        )

        if(updatedPasswordUser){
            return{
                success: true,
                status_code: 200,
                message: 'Password Changed Successfully'
            }
        }

    }
}