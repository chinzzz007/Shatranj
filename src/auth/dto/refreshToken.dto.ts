import { IsString } from "@nestjs/class-validator";

export class RefreshTokenDto{
    @IsString()
    refresh_token: string
}