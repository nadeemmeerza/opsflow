import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  beforeEach(() => {
    controller = new ProjectsController(
      {} as ProjectsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});