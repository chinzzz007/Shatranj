import { Test, TestingModule } from '@nestjs/testing';
import { UserWebsocketGateway } from './user-websocket.gateway';

describe('UserWebsocketGateway', () => {
  let gateway: UserWebsocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserWebsocketGateway],
    }).compile();

    gateway = module.get<UserWebsocketGateway>(UserWebsocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
