import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  Types,
} from 'mongoose';

import {
  Project,
  ProjectDocument,
} from './schemas/project.schema.js';

import { AuditService } from '../audit/audit.service.js';
import { RedisService } from '../redis/redis.service.js';

import { ProjectQueryDto } from './dto/create-project.dto.js';

@Injectable()
export class ProjectsService {
  /**
   * Project detail cache entries are intentionally short-lived.
   *
   * MongoDB remains the source of truth and update/delete operations
   * explicitly invalidate the corresponding Redis entry.
   */
  private readonly projectCacheTtlSeconds = 60;

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    private readonly auditService: AuditService,

    private readonly redisService: RedisService,
  ) {}

  /**
   * Generates an organization-scoped Redis key.
   *
   * Including organizationId is essential for tenant isolation.
   * A project ID alone must never be used as a cross-tenant cache key.
   */
  private getProjectCacheKey(
    organizationId: string,
    projectId: string,
  ): string {
    return `project:${organizationId}:${projectId}`;
  }

  async create(
    organizationId: string,
    userId: string,
    data: {
      name: string;
      key: string;
      description?: string;
    },
  ) {
    try {
      const project =
        await this.projectModel.create({
          name: data.name.trim(),

          key: data.key
            .trim()
            .toUpperCase(),

          description:
            data.description?.trim() ?? '',

          organizationId:
            new Types.ObjectId(
              organizationId,
            ),

          createdBy:
            new Types.ObjectId(userId),

          status: 'active',
        });

      await this.auditService.log({
        organizationId,
        userId,
        action: 'CREATE',
        entity: 'Project',
        entityId:
          project._id.toString(),

        metadata: {
          name: project.name,
          key: project.key,
        },
      });

      return project;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'A project with this key already exists in this organization',
        );
      }

      throw error;
    }
  }

  /**
   * Returns a paginated project collection.
   *
   * Search, filtering, sorting and pagination all happen in MongoDB.
   * This is important because fetching every project first would become
   * inefficient as an organization grows.
   */
  async findAll(
    organizationId: string,
    query: ProjectQueryDto,
  ) {
    const page =
      query.page ?? 1;

    const limit =
      query.limit ?? 10;

    const search =
      query.search?.trim() ?? '';

    const organizationObjectId =
      new Types.ObjectId(
        organizationId,
      );

    /**
     * Every project query is scoped to the organization first.
     * Additional filters are then added to this base condition.
     */
    const filter: Record<
      string,
      unknown
    > = {
      organizationId:
        organizationObjectId,
    };

    if (query.status) {
      filter.status =
        query.status;
    }

    /**
     * Search across the fields that are useful from the
     * Projects screen: name, project key and description.
     */
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          key: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          description: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    /**
     * Convert the validated sort direction into MongoDB's
     * numeric representation.
     */
    const sortDirection =
      query.sortOrder === 'asc'
        ? 1
        : -1;

    const sortBy =
      query.sortBy ??
      'createdAt';

    const skip =
      (page - 1) * limit;

    /**
     * Count and fetch are performed together so the API can return
     * both the current page and the total number of matching records.
     */
    const [items, total] =
      await Promise.all([
        this.projectModel
          .find(filter)
          .sort({
            [sortBy]:
              sortDirection,
          })
          .skip(skip)
          .limit(limit)
          .exec(),

        this.projectModel.countDocuments(
          filter,
        ),
      ]);

    const totalPages =
      Math.ceil(
        total / limit,
      );

    return {
      items,

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(
    organizationId: string,
    projectId: string,
  ) {
    const cacheKey =
      this.getProjectCacheKey(
        organizationId,
        projectId,
      );

    /**
     * CACHE HIT
     *
     * Redis contains a previously fetched project.
     * Hydrating the cached object keeps the return type compatible
     * with the MongoDB-backed path, which returns a Mongoose document.
     */
    const cachedProject =
      await this.redisService.get<
        Record<string, unknown>
      >(cacheKey);

    if (cachedProject) {
      return this.projectModel.hydrate(
        cachedProject,
      );
    }

    /**
     * CACHE MISS
     *
     * MongoDB remains the authoritative source.
     */
    const project =
      await this.projectModel
        .findOne({
          _id: new Types.ObjectId(
            projectId,
          ),

          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
        })
        .exec();

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    /**
     * Store a plain object rather than the Mongoose document itself.
     * This keeps the Redis layer independent of Mongoose internals.
     */
    await this.redisService.set(
      cacheKey,
      project.toObject(),
      this.projectCacheTtlSeconds,
    );

    return project;
  }

  async update(
    organizationId: string,
    projectId: string,
    userId: string,
    data: {
      name?: string;
      key?: string;
      description?: string;
      status?: 'active' | 'archived';
    },
  ) {
    const updateData = {
      ...data,

      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),

      ...(data.key !== undefined && {
        key: data.key
          .trim()
          .toUpperCase(),
      }),

      ...(data.description !==
        undefined && {
        description:
          data.description.trim(),
      }),
    };

    try {
      const project =
        await this.projectModel
          .findOneAndUpdate(
            {
              _id: new Types.ObjectId(
                projectId,
              ),

              organizationId:
                new Types.ObjectId(
                  organizationId,
                ),
            },

            {
              $set: updateData,
            },

            {
              new: true,
              runValidators: true,
            },
          )
          .exec();

      if (!project) {
        throw new NotFoundException(
          'Project not found',
        );
      }

      /**
       * MongoDB has been updated successfully.
       *
       * The cached version is now potentially stale, so invalidate it.
       * The next findOne() request will load the fresh project from MongoDB.
       */
      await this.redisService.delete(
        this.getProjectCacheKey(
          organizationId,
          projectId,
        ),
      );

      await this.auditService.log({
        organizationId,
        userId,
        action: 'UPDATE',
        entity: 'Project',
        entityId:
          project._id.toString(),

        metadata: {
          updatedFields:
            Object.keys(updateData),
        },
      });

      return project;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'A project with this key already exists in this organization',
        );
      }

      throw error;
    }
  }

  async remove(
    organizationId: string,
    projectId: string,
    userId: string,
  ) {
    const project =
      await this.projectModel
        .findOneAndDelete({
          _id: new Types.ObjectId(
            projectId,
          ),

          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
        })
        .exec();

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    /**
     * The project no longer exists in MongoDB.
     * Remove the corresponding Redis entry so a deleted project
     * can never be returned from the cache.
     */
    await this.redisService.delete(
      this.getProjectCacheKey(
        organizationId,
        projectId,
      ),
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: 'DELETE',
      entity: 'Project',
      entityId:
        project._id.toString(),

      metadata: {
        name: project.name,
        key: project.key,
      },
    });

    return {
      success: true,
      message:
        'Project deleted successfully',
    };
  }
}