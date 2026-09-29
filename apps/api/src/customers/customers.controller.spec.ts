import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';

describe('CustomersController', () => {
  let controller: CustomersController;

  beforeEach(() => {
    controller = new CustomersController(
      {} as CustomersService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});