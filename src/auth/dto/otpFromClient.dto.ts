import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class OtpFromClientDto{
    @IsNotEmpty({message: "Field can't be empty"})
    @IsString()
    resetOtp: string

    @IsNotEmpty()
    @IsEmail()
    email: string
}