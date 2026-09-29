import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

describe('TicketsController', () => {
  let controller: TicketsController;

  beforeEach(() => {
    controller = new TicketsController(
      {} as TicketsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});