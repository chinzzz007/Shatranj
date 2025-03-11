import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig, { CONFIG_JWT_SECRET } from 'src/config/jwt.config';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { MailerModule } from '@nestjs-modules/mailer';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forFeature([{name: User.name, schema: UserSchema}, {name: RefreshToken.name, schema: RefreshTokenSchema}]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) =>{
        return{
          secret: configService.get(CONFIG_JWT_SECRET),
        }
      },
      inject: [ConfigService],
    }),
    MailerModule.forRoot({
      transport:{
        service: 'gmail',
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: false,
        auth:{
          user: process.env.GMAIL_EMAIL_USERNAME,
          pass: process.env.GMAIL_EMAIL_PASSWORD 
        }
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}