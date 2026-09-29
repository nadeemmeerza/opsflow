import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

describe('TasksController', () => {
  let controller: TasksController;

  beforeEach(() => {
    controller = new TasksController(
      {} as TasksService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});