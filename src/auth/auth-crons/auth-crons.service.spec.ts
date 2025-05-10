import { Test, TestingModule } from '@nestjs/testing';
import { AuthCronsService } from './auth-crons.service';

describe('AuthCronsService', () => {
  let service: AuthCronsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthCronsService],
    }).compile();

    service = module.get<AuthCronsService>(AuthCronsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
