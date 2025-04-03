import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket} from "socket.io";
import { AuthWsMiddleware } from "src/middlewares/auth-ws.middleware";
import { UsersService } from "src/users/users.service";


@WebSocketGateway({ cors: { origin: '*' } })
export class Gateway implements OnGatewayInit, OnGatewayConnection{
    @WebSocketServer()
    server: Server

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UsersService,
    ){}

    afterInit() {
        console.log('WebSocket Gateway Initialized');
    }

    async handleConnection(socket: Socket) {
        const middleware = AuthWsMiddleware(
            this.jwtService,
            this.configService,
            this.userService
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