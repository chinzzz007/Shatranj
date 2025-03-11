import { IsString } from "@nestjs/class-validator";
import { IsNotEmpty } from "class-validator";

export class ResetPasswordDto{
    @IsNotEmpty({message: "Cannot be empty"})
    @IsString()
    reset_password: string

    @IsNotEmpty({message: "Cannot be empty"})
    @IsString()
    confirm_reset_password: string
}