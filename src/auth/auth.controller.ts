import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { User } from 'src/users/schemas/user.schema';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import {UserTokens} from './interfaces/user-tokens.interface'
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ReturnResponse } from './interfaces/return-response.interface';
import { OtpFromClientDto } from './dto/otpFromClient.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpData: SignUpDto): Promise<User>{
    return this.authService.signup(signUpData);
  }

  @Post('signin')
  async signIn(@Body() singInData: SignInDto): Promise<UserTokens> {
    return this.authService.signin(singInData);
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto){
    return this.authService.refreshTokens(refreshTokenDto.refresh_token);
  }

  @Post('forgot_password/otp_to_client')
  async forgotPasswordOtpToClient(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ReturnResponse>{
    return this.authService.forgotPasswordOtpToClient(forgotPasswordDto);
  }

  @Post('forgot_password/otp_from_client')
  async forgotPasswordOtpFromClient(@Body() otpFromClientDto: OtpFromClientDto): Promise<ReturnResponse>{
    return this.authService.forgotPasswordOtpFromClient(otpFromClientDto);
  }

  @Post('forgot_password/reset_password')
  async forgotPasswordResetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() req){
    return this.authService.forgotPasswordResetPassword(resetPasswordDto, req);
  }
}
