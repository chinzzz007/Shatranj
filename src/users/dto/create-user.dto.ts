import { IsEmail, IsNotEmpty } from "@nestjs/class-validator";

export class CreateUserDto{
    @IsNotEmpty({message: "Username is required"})
    username: string

    @IsNotEmpty({message: "Email Id is required"})
    @IsEmail({}, {message: "Invalid Email Id"})
    email: string

    @IsNotEmpty({message: "Password is required"})
    password: string

    @IsNotEmpty({message: "Name is required"})
    full_name: string

}