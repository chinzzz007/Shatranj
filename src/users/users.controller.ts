import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { Request, Response} from 'express';
import { ReturnResponse } from 'src/auth/interfaces/return-response.interface';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(201)
  @Post('change_password')
  async changePassword(@Body() changePasswordData: ChangePasswordDto, @Req() req:Request): Promise<ReturnResponse>{
    const user_id = req['user_id'];
    return this.usersService.changePassword(changePasswordData, user_id);
  }

  // Signing out from the user's current device not all
  @HttpCode(200)
  @Get('user_signout')
  async userSignout(@Req() req: Request, @Res({passthrough: true}) res: Response): Promise <ReturnResponse>{
    res.clearCookie('refresh_token')
    res.clearCookie('access_token')
    return {
      success: true,
      status_code: 200,
      message: "User signed out!"
    }
  }

  @HttpCode(200)
  @Get('hello_user')
  async helloToUser(){
    return {"message" : "hello to user"}
  }
}
