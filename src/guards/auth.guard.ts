import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";
import { Request } from 'express';


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if(!token){
            throw new UnauthorizedException('Missing Auth Token');
        }

        try{
            const payload = this.jwtService.verify(token);
            request['user_id'] = payload.user_id;
            return true;
        }catch(e){
            Logger.error(e.message);
            throw new UnauthorizedException('Invalid Token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined{
        const access_token = request.cookies['access_token'];
        if(!access_token){
            return undefined
        }
        return access_token;
    }
}