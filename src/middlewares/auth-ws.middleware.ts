import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";
import { UnauthorizedException } from "@nestjs/common";
import { ObjectId } from "mongoose";
import { ConfigService } from "@nestjs/config";
import * as dotenv from 'dotenv';
import { CONFIG_JWT_SECRET } from "src/config/jwt.config";
dotenv.config();


interface JwtTokenPayload{
    user_id: ObjectId
}

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const AuthWsMiddleware = (
    jwtService: JwtService,
    configService: ConfigService,
): SocketMiddleware => {
    return async(socket, next) =>{
        try{
            const token = socket.handshake.headers.cookie;
            if(!token) throw new Error('No cookies found');
            console.log(token);
            

            if(!token) throw new Error('Auth Token is missing');
            
            let payload: JwtTokenPayload | null = null;
            console.log(payload);
            try{
                payload = await jwtService.verifyAsync<JwtTokenPayload>(token,{
                    secret: configService.get(CONFIG_JWT_SECRET)
                });
                console.log(payload.user_id);
            }catch(e){
                console.log(e);
                throw new Error('Authorization token is invalid');
            }
            
            socket = Object.assign(socket, {
                user_id: payload.user_id
            })
            next();

        }catch(e){
            console.log(e);
            throw new UnauthorizedException('Unauthorized Connection')
        }
    }
}