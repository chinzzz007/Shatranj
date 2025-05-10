import { IsString } from "@nestjs/class-validator";
import { IsNotEmpty } from "class-validator";

export class ChangePasswordDto{
    @IsNotEmpty({message: "Old Password can't be empty"})
    @IsString()
    old_password: string

    @IsNotEmpty({message: "New Password can't be empty"})
    @IsString()
    new_password: string
}