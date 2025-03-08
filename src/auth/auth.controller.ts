import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { User } from 'src/users/schemas/user.schema';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import {UserTokens} from './interfaces/user-tokens.interface'

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
}
