
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { CustomersService } from './customers.service.js';
import { Customer } from './schemas/customer.schema.js';
import { AuditService } from '../audit/audit.service.js';

describe('CustomersService', () => {
  let service: CustomersService;

  const customerModel = {
    create: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  };

  const auditService = {
    log: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getModelToken(Customer.name),
          useValue: customerModel,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer and write an audit log', async () => {
      const organizationId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      const customer = {
        _id: {
          toString: () => '507f1f77bcf86cd799439013',
        },
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        company: 'Acme',
        notes: 'Important customer',
      };

      customerModel.findOne.mockResolvedValue(null);
      customerModel.create.mockResolvedValue(customer);

      const result = await service.create(
        organizationId,
        userId,
        {
          name: '  John Doe  ',
          email: ' JOHN@EXAMPLE.COM ',
          phone: ' 1234567890 ',
          company: ' Acme ',
          notes: ' Important customer ',
        },
      );

      expect(customerModel.findOne).toHaveBeenCalledWith({
        organizationId: expect.anything(),
        email: 'john@example.com',
      });

      expect(customerModel.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        company: 'Acme',
        notes: 'Important customer',
        organizationId: expect.anything(),
        createdBy: expect.anything(),
        status: 'active',
      });

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'CREATE',
        entity: 'Customer',
        entityId: '507f1f77bcf86cd799439013',
        metadata: {
          name: customer.name,
          email: customer.email,
          company: customer.company,
        },
      });

      expect(result).toEqual(customer);
    });

    it('should create a customer without checking duplicate email when email is omitted', async () => {
      const customer = {
        _id: {
          toString: () => 'customer-123',
        },
        name: 'John Doe',
      };

      customerModel.create.mockResolvedValue(customer);

      const result = await service.create(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        {
          name: 'John Doe',
        },
      );

      expect(customerModel.findOne).not.toHaveBeenCalled();
      expect(customerModel.create).toHaveBeenCalledTimes(1);
      expect(auditService.log).toHaveBeenCalledTimes(1);
      expect(result).toEqual(customer);
    });

    it('should throw ConflictException when the email already exists', async () => {
      customerModel.findOne.mockResolvedValue({
        _id: 'existing-customer',
      });

      await expect(
        service.create(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
          {
            name: 'John Doe',
            email: 'john@example.com',
          },
        ),
      ).rejects.toThrow('A customer with this email already exists');

      expect(customerModel.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const items = [
        {
          _id: 'customer-1',
          name: 'John Doe',
        },
        {
          _id: 'customer-2',
          name: 'Jane Doe',
        },
      ];

      const exec = vi.fn().mockResolvedValue(items);
      const limit = vi.fn().mockReturnValue({ exec });
      const skip = vi.fn().mockReturnValue({ limit });
      const sort = vi.fn().mockReturnValue({ skip });

      customerModel.find.mockReturnValue({
        sort,
      });

      customerModel.countDocuments.mockResolvedValue(25);

      const result = await service.findAll(
        '507f1f77bcf86cd799439011',
        {
          page: 2,
          limit: 10,
        },
      );

      expect(customerModel.find).toHaveBeenCalledWith({
        organizationId: expect.anything(),
      });

      expect(sort).toHaveBeenCalledWith({
        createdAt: -1,
      });

      expect(skip).toHaveBeenCalledWith(10);
      expect(limit).toHaveBeenCalledWith(10);
      expect(exec).toHaveBeenCalledTimes(1);

      expect(customerModel.countDocuments).toHaveBeenCalledWith({
        organizationId: expect.anything(),
      });

      expect(result).toEqual({
        items,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('should apply status and search filters', async () => {
      const exec = vi.fn().mockResolvedValue([]);
      const limit = vi.fn().mockReturnValue({ exec });
      const skip = vi.fn().mockReturnValue({ limit });
      const sort = vi.fn().mockReturnValue({ skip });

      customerModel.find.mockReturnValue({
        sort,
      });

      customerModel.countDocuments.mockResolvedValue(0);

      await service.findAll(
        '507f1f77bcf86cd799439011',
        {
          page: 1,
          limit: 10,
          status: 'active',
          search: 'Acme',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      );

      const findFilter =
        customerModel.find.mock.calls[0][0];

      expect(findFilter.organizationId).toBeDefined();
      expect(findFilter.status).toBe('active');
      expect(findFilter.$or).toHaveLength(4);

      expect(sort).toHaveBeenCalledWith({
        name: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return a customer belonging to the organization', async () => {
      const customer = {
        _id: 'customer-123',
        name: 'John Doe',
      };

      const exec = vi.fn().mockResolvedValue(customer);

      customerModel.findOne.mockReturnValue({
        exec,
      });

      const result = await service.findOne(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );

      expect(customerModel.findOne).toHaveBeenCalledWith({
        _id: expect.anything(),
        organizationId: expect.anything(),
      });

      expect(exec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(customer);
    });

    it('should throw NotFoundException when the customer does not exist', async () => {
      const exec = vi.fn().mockResolvedValue(null);

      customerModel.findOne.mockReturnValue({
        exec,
      });

      await expect(
        service.findOne(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
        ),
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const customer = {
        _id: 'customer-123',
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      customerModel.findOne.mockResolvedValue(null);

      const exec = vi.fn().mockResolvedValue(customer);

      customerModel.findOneAndUpdate.mockReturnValue({
        exec,
      });

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        {
          name: ' Updated Name ',
          email: ' UPDATED@EXAMPLE.COM ',
        },
      );

      expect(customerModel.findOne).toHaveBeenCalledWith({
        organizationId: expect.anything(),
        email: 'updated@example.com',
        _id: {
          $ne: expect.anything(),
        },
      });

      expect(customerModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.anything(),
          organizationId: expect.anything(),
        },
        {
          $set: {
            name: 'Updated Name',
            email: 'updated@example.com',
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      expect(result).toEqual(customer);
    });

    it('should throw ConflictException when the new email already exists', async () => {
      customerModel.findOne.mockResolvedValue({
        _id: 'existing-customer',
      });

      await expect(
        service.update(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
          '507f1f77bcf86cd799439013',
          {
            email: 'john@example.com',
          },
        ),
      ).rejects.toThrow(
        'A customer with this email already exists',
      );

      expect(
        customerModel.findOneAndUpdate,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the customer does not exist', async () => {
      const exec = vi.fn().mockResolvedValue(null);

      customerModel.findOne.mockResolvedValue(null);

      customerModel.findOneAndUpdate.mockReturnValue({
        exec,
      });

      await expect(
        service.update(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
          '507f1f77bcf86cd799439013',
          {
            name: 'Updated Name',
          },
        ),
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('remove', () => {
    it('should delete a customer', async () => {
      const customer = {
        _id: 'customer-123',
        name: 'John Doe',
      };

      const exec = vi.fn().mockResolvedValue(customer);

      customerModel.findOneAndDelete.mockReturnValue({
        exec,
      });

      const result = await service.remove(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
      );

      expect(customerModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: expect.anything(),
        organizationId: expect.anything(),
      });

      expect(exec).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        success: true,
        message: 'Customer deleted successfully',
      });
    });

    it('should throw NotFoundException when the customer does not exist', async () => {
      const exec = vi.fn().mockResolvedValue(null);

      customerModel.findOneAndDelete.mockReturnValue({
        exec,
      });

      await expect(
        service.remove(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
          '507f1f77bcf86cd799439013',
        ),
      ).rejects.toThrow('Customer not found');
    });
  });
});
