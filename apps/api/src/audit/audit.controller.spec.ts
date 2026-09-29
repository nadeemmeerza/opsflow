import { AuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';

describe('AuditController', () => {
  let controller: AuditController;

  beforeEach(() => {
    controller = new AuditController(
      {} as AuditService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});