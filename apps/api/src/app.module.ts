import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { DatabaseModule } from './database/database.module.js';
import { ConfigModule } from '@nestjs/config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { UsersModule } from './users/users.module.js';
import { PasswordService } from './auth/password/password.service.js';
import { AuthModule } from './auth/auth.module.js';
import { OrganizationMembersModule } from './organization-members/organization-members.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { AuditModule } from './audit/audit.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { RedisModule } from './redis/redis.module.js';
import { HealthModule } from './health/health.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    // ObserveModule.forRoot({
    //   appKey: 'YOUR_APP_KEY',
    //   appSecret: 'YOUR_APP_SECRET',
    //   serviceId: 'api',
    // }),
    OrganizationsModule,
    DatabaseModule,
    UsersModule,
    OrganizationMembersModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    CustomersModule,
    TicketsModule,
    CommentsModule,
    AuditModule,
    DashboardModule,
    RedisModule,
     HealthModule,
  ],

  controllers: [AppController],
  providers: [AppService, PasswordService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
