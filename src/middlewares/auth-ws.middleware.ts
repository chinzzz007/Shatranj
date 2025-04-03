import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";
import * as cookie from 'cookie';
import { UsersService } from "src/users/users.service";
import { UnauthorizedException } from "@nestjs/common";
import { ObjectId } from "mongoose";

interface JwtTokenPayload{
    user_id: ObjectId
}

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const AuthWsMiddleware = (
    jwtService: JwtService,
    configService: ConfigService,
    userService: UsersService
): SocketMiddleware => {
    return async(socket, next) =>{
        try{
            const cookies = socket.handshake.headers.cookie;
            if(!cookies) throw new Error('No cookies found');
            
            const token = cookies;

            if(!token) throw new Error('Auth Token is missing');
            
            let payload: JwtTokenPayload | null = null;
            try{
                payload = await jwtService.verifyAsync<JwtTokenPayload>(token);
            }catch(e){
                throw new Error('Authorization token is invalid');
            }
            console.log(payload.user_id);
            
            socket = Object.assign(socket, {
                user_id: payload.user_id
            })
            next();

        }catch(e){
            throw new UnauthorizedException('Unauthorized Connection')
        }
    }
}