import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { UsersService } from '../users.service';
import { Server, Socket } from 'socket.io';
import { ConnectionGateway } from 'src/gateways/connection.gateway';

@WebSocketGateway({cors: { origin: "*"}})
export class UserWebsocketGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly usersService: UsersService) {}

  @SubscribeMessage('hello')
  handleMessage(client: Socket, payload: string) {
    const msg = this.usersService.respondToSocket(payload);
    client.emit('response', msg);
  }
}
