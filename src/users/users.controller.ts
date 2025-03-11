import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ChangePasswordDto } from './dto/changePassword.dto';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('change_password')
  async changePassword(@Body() changePasswordData: ChangePasswordDto, @Req() req){
    return this.usersService.changePassword(changePasswordData, req);
  }
}
