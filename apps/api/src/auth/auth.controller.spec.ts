import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    controller = new AuthController(
      {} as AuthService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});