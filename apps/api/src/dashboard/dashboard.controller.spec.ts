import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(() => {
    controller = new DashboardController(
      {} as DashboardService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});