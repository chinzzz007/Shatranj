import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ReturnResponse } from './interfaces/return-response.interface';
import { OtpFromClientDto } from './dto/otpFromClient.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(201)
  @Post('signup')
  async signUp(@Body() signUpData: SignUpDto): Promise<ReturnResponse>{
    return this.authService.signup(signUpData);
  }

  @HttpCode(200)
  @Post('signin')
  async signIn(@Body() singInData: SignInDto, @Res({passthrough: true}) res: Response): Promise<ReturnResponse> {
    const resp = await this.authService.signin(singInData);

    if(resp.success){
      res.cookie('access_token', resp?.data?.access_token, {
        httpOnly: true, 
        secure: false, // true incase of https
        maxAge: 1000*60*60*24*3,
        sameSite: 'lax', // allows cookies on same-site requests
      })

      res.cookie('refresh_token', resp?.data?.refresh_token, {
        httpOnly: true, 
        secure: false, // true incase of https
        maxAge: 1000*60*60*24*7,
        sameSite: 'lax', // allows cookies on same-site requests
      })

      return {
        success: true,
        status_code: 201,
        message: "Sign In was successfull"
      }
    }

    return resp;
  }

  @HttpCode(200)
  @Get('refresh')
  async refreshTokens(@Req() req: Request, @Res({passthrough: true}) res: Response): Promise<ReturnResponse>{
    const refresh_token = req.cookies['refresh_token'];

    if(refresh_token){
      const resp = await this.authService.refreshTokens(refresh_token);

      res.cookie('access_token', resp?.data?.access_token, {
        httpOnly: true, 
        secure: false, // true incase of https
        maxAge: 1000*60*60*24*3,
        sameSite: 'lax', // allows cookies on same-site requests
      })

      res.cookie('refresh_token', resp?.data?.refresh_token, {
        httpOnly: true, 
        secure: false, // true incase of https
        maxAge: 1000*60*60*24*7,
        sameSite: 'lax', // allows cookies on same-site requests
      })

      return {
        success: true,
        status_code: 201,
        message: "Sign In was successfull"
      }
    }

    throw new UnauthorizedException({
      success: false,
      status_code: 401,
      message: "Please signin again"
    })
  }

  @HttpCode(200)
  @Post('forgot_password/otp_to_client')
  async forgotPasswordOtpToClient(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ReturnResponse>{
    return this.authService.forgotPasswordOtpToClient(forgotPasswordDto);
  }

  @HttpCode(201)
  @Post('forgot_password/otp_from_client')
  async forgotPasswordOtpFromClient(@Body() otpFromClientDto: OtpFromClientDto, @Res({passthrough: true}) res: Response): Promise <ReturnResponse>{
    const resp = await this.authService.forgotPasswordOtpFromClient(otpFromClientDto);

    if(resp.success){
      res.cookie('password_uuid', resp?.data?.temp_uuid,{
        httpOnly: true, 
        secure: false, // true incase of https
        maxAge: 1000*60*15,
        sameSite: 'lax', // allows cookies on same-site requests
      })

      return {
        success: true,
        status_code: 201,
        message: "Otp verified successfully" 
      }
    }

    return resp;
  }

  @HttpCode(201)
  @Post('forgot_password/reset_password')
  async forgotPasswordResetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() req: Request): Promise<ReturnResponse>{
    const password_uuid = req.cookies['password_uuid'];
  
    if(password_uuid){
      return this.authService.forgotPasswordResetPassword(resetPasswordDto, password_uuid);
    }

    throw new BadRequestException({
      success: false,
      status_code: 400,
      message: "Invalid password changing request"
    })
  }
}
