import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket} from "socket.io";
import { AuthWsMiddleware } from "src/middlewares/auth-ws.middleware";


@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class ConnectionGateway implements OnGatewayInit, OnGatewayConnection{
    @WebSocketServer()
    server: Server

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ){}

    afterInit() {
        console.log('Websocket Connection Gateway Initialized');
    }

    async handleConnection(socket: Socket) {
        const middleware = AuthWsMiddleware(
            this.jwtService,
            this.configService
        );

        await middleware(socket, (error? : Error)=>{
            if(error){
                console.error('Socket authentication failed: ', error.message);
                socket.disconnect();
            }else{
                console.log(`${socket} connected via WebSocket`);
            }
        })
    }
}