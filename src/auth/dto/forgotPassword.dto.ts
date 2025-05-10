import { IsEmail, IsNotEmpty } from "class-validator";

export class ForgotPasswordDto{
    @IsNotEmpty({message: "Field can't be empty"})
    @IsEmail({}, {message: "Invalid Email Id"})
    email: string
}