import { BadRequestException, Injectable, Logger, Render, Req, Res, UnauthorizedException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Mongoose } from 'mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {v4 as uuidv4} from 'uuid'; 
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ReturnResponse } from './interfaces/return-response.interface';
import { OtpFromClientDto } from './dto/otpFromClient.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { OtpRecords } from './schemas/otp-records.schema';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private UserModel: Model<User>,
        // @InjectModel(RefreshToken.name) private RefreshTokenModel: Model<RefreshToken>,
        @InjectModel(OtpRecords.name) private OtpRecordsModel: Model<OtpRecords>,
        private jwtService: JwtService,
        private readonly mailService: MailerService
    ) {}

    async signup(signUpData: SignUpDto): Promise<ReturnResponse>{
        try{
            const {email, username, password, full_name} = signUpData;
            
            // Checking for existence of mail in the database
            const emailInUse = await this.UserModel.findOne({
                email: email,
            })
            if(emailInUse){
                throw new BadRequestException({
                    success: false,
                    status_code: 400, 
                    message: "User already registered",
                })
            }

            // Checking for the existence of username in the database
            const usernameInUse = await this.UserModel.findOne({
                username: username,
            })
            if(usernameInUse){
                throw new BadRequestException({
                    success: false,
                    status_code: 400, 
                    message: "Username already taken",
                })
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
            
            return {
                success: true,
                status_code: 201, 
                message: "User created",
            }
        }
        catch(error){
            throw error
        }
    }

    async signin(signInData: SignInDto): Promise<ReturnResponse>{
        const {email, username, password} = signInData;

        // Finding user for the provided mail & username
        const user = await this.UserModel.findOne({
            email: email, 
            username: username
        })

        if(!user) {
            throw new BadRequestException({
                success: false,
                status_code: 400, 
                message: "Invalid Credentials",
            })
        }

        // Comparison of password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if(!passwordMatch){
            throw new BadRequestException({
                success: false,
                status_code: 400,
                message: "Wrong password"    
            })
        }

        // Generate JWT tokens
        return this.generateUserTokens(user._id);
    }

    async generateUserTokens(user_id: mongoose.Types.ObjectId): Promise<ReturnResponse>{
        // generating accessToken 
        const access_token = this.jwtService.sign({user_id}, {expiresIn: '3d'});
        const refresh_token = uuidv4();
        await this.storeRefreshToken(refresh_token, user_id);
        return {
            success: true,
            status_code: 201,
            message: "User signed in successfully",
            data: {
                access_token: access_token,
                refresh_token: refresh_token
            }
        }
    }

    async storeRefreshToken(refresh_token: string, user_id: Object){
        const expiry_date = new Date();
        expiry_date.setDate(expiry_date.getDate() + 7);

        // storing refresh token in db
        await this.UserModel.updateOne(
            {_id: user_id},
            {$set: {
                refresh_token: refresh_token, 
                expiry_date: expiry_date
            }},
            {upsert: true}
        );
    }

    async refreshTokens(refresh_token: string): Promise<ReturnResponse>{
        const stored_token = await this.UserModel.findOne({
            refresh_token: refresh_token,
        })

        if(!stored_token){
            throw new UnauthorizedException({
                success: false,
                status_code: 401,
                message: "Please sign in again"
            });
        }

        return this.generateUserTokens(stored_token._id);
    }

    // When the user want to reset the password they forgot 
    async forgotPasswordOtpToClient(forgotPasswordProvidedData : ForgotPasswordDto):Promise<ReturnResponse>{ 
        const {email} = forgotPasswordProvidedData;

        try{
            // Checking for the existence of the provided email
            const existingUser = await this.UserModel.findOne({
                email: email
            })
            if(!existingUser){
                throw new BadRequestException({
                    success: false,
                    status_code: 400,
                    message: "User doesn't exist"
                })
            }

            // If email is present generating and storing an otp in database
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
            throw error
        }
    }

    // Step while generating otp for users
    async generateAndStoreOtp(existingUser: UserDocument): Promise<string>{
        let resetOtp;
        let otpExists;
        
        // checking whether generated otp is unique or not
        do{
            resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
            otpExists = await this.OtpRecordsModel.exists({otp: resetOtp});
        } while (otpExists);

        // creating expiry time for otp - 5 minutes
        const expiry_time = new Date(Date.now() + 5*60*1000);
        
        await this.OtpRecordsModel.updateOne(
            {email: existingUser.email},
            {$set: {otp: resetOtp, expiry_time: expiry_time}},
            {upsert: true}
        )

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

    // Validating the otp and setting up uuid for password reset
    async forgotPasswordOtpFromClient(otpFromClientData: OtpFromClientDto): Promise<ReturnResponse>{
        try{
            const {resetOtp, email} = otpFromClientData;
            
            const existingOtpClient = await this.OtpRecordsModel.findOne({
                email: email
            })

            // if user hasn't requested for any otp
            if(!existingOtpClient){
                throw new BadRequestException({
                    success: false, 
                    status_code: 400,
                    message: "Haven't requested for any otp"
                });
            }

            // If provided otp is expired
            if(existingOtpClient.expiry_time < new Date()){
                throw new BadRequestException({
                    success: false,
                    status_code: 400,
                    message: "Otp Expired, Please request for new one!"
                });
            } 

            // if provided otp doesnot match the db otp
            if(resetOtp !== existingOtpClient.otp){
                throw new BadRequestException({
                    success: false,
                    status_code: 400,
                    message: "Invalid Otp"
                });
            }

            // generating and storing a uuid for further password changing
            existingOtpClient.expiry_time = new Date();
            existingOtpClient.temp_uuid = uuidv4();
            existingOtpClient.uuid_expiry = new Date(Date.now() + 15*60*1000);
            await existingOtpClient.save();
            
            return{
                success: true,
                status_code: 201,
                message: 'You can change your password!',
                data: {
                    temp_uuid: existingOtpClient.temp_uuid
                }
            }
        }
        catch(error){
            throw error;
        }
    }

    // Setting up a new password
    async forgotPasswordResetPassword(resetPasswordData: ResetPasswordDto, password_uuid: string): Promise<ReturnResponse>{
        try{
            const {reset_password, confirm_reset_password} = resetPasswordData;
            
            if(reset_password != confirm_reset_password){
                throw new BadRequestException({
                    success: false,
                    status_code: 400,
                    message: "Passwords aren't matching"
                });
            }

            const existingOtpRecord = await this.OtpRecordsModel.findOne({
                temp_uuid: password_uuid
            })
            if(!existingOtpRecord){
                throw new UnauthorizedException({
                    success: false,
                    status_code: 401,
                    message: "No otp record found"
                });
            }

            if(existingOtpRecord.uuid_expiry < new Date()){
                throw new BadRequestException({
                    success: false,
                    status_code: 400,
                    message: "Password reseting time expired"
                })
            }
            Logger.log("working3");
            
            await existingOtpRecord.deleteOne();
            Logger.log("working1");

            const hashedPassword = await bcrypt.hash(reset_password, 10);
            await this.UserModel.updateOne(
                {email: existingOtpRecord.email},
                {
                    $set:{
                        password: hashedPassword,
                    }
                }
            )
            Logger.log("working2");


            return{
                success: true,
                status_code: 201,
                message: 'Password Changed Successfully'
            }
        }
        catch(error){
            throw error;
        }
    }
}