import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  // Both routes back uptime monitors, so a 200 with a parseable body is the
  // whole contract — a 404 or a thrown error here would page someone.
  describe.each([
    ['root', () => appController.root()],
    ['health', () => appController.health()],
  ])('%s', (_name, call) => {
    it('reports a healthy status payload', () => {
      const body = call();
      expect(body.status).toBe('ok');
      expect(body.service).toBe('vendor-management-api');
      expect(typeof body.uptime).toBe('number');
      expect(Number.isNaN(Date.parse(body.time))).toBe(false);
    });
  });
});
