import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { User } from 'src/users/schemas/user.schema';

interface UserTokens{
  accessToken: string
}

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
}
