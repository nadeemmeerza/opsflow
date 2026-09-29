import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';

describe('CommentsController', () => {
  let controller: CommentsController;

  beforeEach(() => {
    controller = new CommentsController(
      {} as CommentsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});