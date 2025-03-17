import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { Request} from 'express';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('change_password')
  async changePassword(@Body() changePasswordData: ChangePasswordDto, @Req() req:Request){
    const user_id = req['user_id'];
    return this.usersService.changePassword(changePasswordData, user_id);
  }

  // @Get('user_signout')
  // async userSignout(@Req() req: Request, @Res({passthrough: true}) res: Response){
  //   const refresh_token = req.cookies['refresh_token'];
  //   const access_token = req.cookies['access_token'];
  // }
}
