# OpsFlow — Enterprise Operations Management Platform

OpsFlow is a production-oriented, multi-tenant business operations platform built as a **Turborepo monorepo**.

The application combines organization management, project and task tracking, customer management, support tickets, team membership, comments, audit logging, dashboards, authentication, role-based authorization, MongoDB persistence, Redis caching, automated tests, and Docker-based infrastructure.

The project was designed as a portfolio application to demonstrate how a modern full-stack business application can be structured beyond simple CRUD screens.

---

## 1. What is OpsFlow?

OpsFlow is designed around the idea that a business should be able to manage its day-to-day operations from one application.

A typical user journey is:

```text
User
  │
  ▼
Next.js Web Application
  │
  │ HTTP / JSON
  ▼
NestJS API
  │
  ├── Authentication
  ├── Organization membership
  ├── Role authorization
  ├── Business modules
  ├── Audit logging
  └── Redis caching
  │
  ├───────────────┐
  ▼               ▼
MongoDB          Redis
Data             Cache
```

The application is **multi-tenant**: organization-owned resources are scoped by `organizationId`, and access is controlled by the user's membership and role inside that organization.

---

# 2. Main Features

## Authentication

- User registration
- User login
- JWT access-token authentication
- Password hashing with Argon2id
- Active/suspended user status
- JWT expiration
- Protection against access by inactive users

## Organizations

Users can:

- Create organizations
- View organizations they belong to
- View organization details
- Update organization information
- Delete organizations

Organizations provide the tenant boundary for business data.

## Organization Members

Organizations support three roles:

```text
Owner
Admin
Member
```

Members can be added and removed according to authorization rules.

The members interface supports organization membership management, including searching/filtering/sorting/pagination on the backend.

## Projects

Projects belong to organizations and contain:

- Name
- Project key
- Description
- Status
- Creator
- Organization

Project keys are unique inside an organization.

## Tasks

Tasks belong to projects and organizations.

They support:

- Title
- Description
- Assignee
- Status
- Priority
- Due date
- Creation/update tracking
- Audit logging

Task status includes:

```text
todo
in_progress
review
done
```

Priority includes:

```text
low
medium
high
urgent
```

## Customers

Customers are managed within an organization and can be associated with operational records such as support tickets.

## Support Tickets

Tickets provide a customer-support workflow.

A ticket can contain:

- Title
- Description
- Customer
- Project
- Assignee
- Status
- Priority
- Creator
- Audit history

Ticket priority supports:

```text
low
medium
high
urgent
```

## Comments

Comments provide collaboration around operational records.

The backend protects comment operations using authentication, organization membership, and role authorization where required.

## Dashboard

The dashboard provides operational information aggregated from the organization's data.

The dashboard is backed by a dedicated NestJS service rather than calculating everything directly in the frontend.

## Audit Logs

Important business actions are recorded in the audit system.

Examples include:

- Organization creation/update/deletion
- Project creation/update/deletion
- Task creation/update/deletion
- Customer operations
- Ticket operations
- Membership changes
- Comment-related actions

An audit record contains information such as:

```text
organizationId
userId
action
entity
entityId
metadata
timestamp
```

This provides traceability for business operations.

---

# 3. Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| Next.js | React framework and application routing |
| React | UI development |
| TypeScript | Type safety |
| Redux Toolkit | Application state management |
| RTK Query | API communication, caching and invalidation |
| SCSS Modules | Component/page styling |
| Next.js App Router | Frontend routing |

The frontend uses feature-oriented API modules and generated RTK Query hooks.

For example:

```text
apps/web/src/features/
├── organizations/
├── projects/
├── tasks/
├── customers/
├── tickets/
├── comments/
└── ...
```

The UI communicates with the backend through the API layer instead of accessing MongoDB directly.

## Backend

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeScript | Type-safe backend development |
| MongoDB | Primary database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| Passport | Authentication strategy integration |
| Argon2 | Password hashing |
| class-validator | DTO validation |
| Redis | Caching |
| ioredis | Redis client |
| Vitest | Automated testing |

## Infrastructure

| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Local/deployment infrastructure orchestration |
| MongoDB Docker container | Database |
| Redis Docker container | Cache |
| pnpm | Package management |
| Turborepo | Monorepo task orchestration |

---

# 4. Monorepo Architecture

The repository is organized as:

```text
opsflow/
│
├── apps/
│   ├── api/              # NestJS backend
│   └── web/              # Next.js frontend
│
├── packages/
│   └── types/            # Shared package area
│
├── docker/
├── docs/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

The reason for using a monorepo is to keep the frontend, backend, and shared packages in one coordinated repository while still maintaining clear application boundaries.

---

# 5. High-Level Architecture

```text
                         ┌───────────────────────┐
                         │       Browser         │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │   Next.js Frontend    │
                         │       :3001           │
                         └───────────┬───────────┘
                                     │
                              HTTP / JSON
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      NestJS API       │
                         │       :3000           │
                         └───────────┬───────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
          ┌────────────┐      ┌────────────┐      ┌────────────┐
          │   Auth &   │      │ Business   │      │   Audit    │
          │ Authorization│     │ Modules    │      │   Logs     │
          └────────────┘      └──────┬─────┘      └────────────┘
                                     │
                              ┌──────┴──────┐
                              ▼             ▼
                       ┌────────────┐ ┌────────────┐
                       │  MongoDB   │ │   Redis    │
                       │  Database  │ │   Cache    │
                       └────────────┘ └────────────┘
```

---

# 6. Frontend Architecture

The frontend is built with Next.js and follows a feature-oriented structure.

The main idea is to separate:

```text
Pages
  ↓
UI Components
  ↓
Feature API modules
  ↓
RTK Query
  ↓
NestJS API
```

For example, the organizations frontend has an API module that defines queries and mutations such as:

```text
GET    /organizations
GET    /organizations/:id
POST   /organizations
PATCH  /organizations/:id
DELETE /organizations/:id
```

RTK Query generates hooks such as:

```text
useGetOrganizationsQuery()
useGetOrganizationQuery()
useCreateOrganizationMutation()
useUpdateOrganizationMutation()
useDeleteOrganizationMutation()
```

After mutations, cache tags are invalidated so the UI can refresh the relevant data.

This avoids manually writing repetitive loading, error, request and cache-management logic for every screen.

---

# 7. Backend Architecture

NestJS is organized into business modules.

The major backend modules include:

```text
auth/
users/
organizations/
organization-members/
projects/
tasks/
customers/
tickets/
comments/
audit/
dashboard/
redis/
health/
database/
common/
```

Each business area follows the NestJS module pattern:

```text
Module
 ├── Controller
 ├── Service
 ├── DTOs
 └── Schemas
```

The controller handles HTTP requests.

The service contains business logic.

DTOs validate incoming data.

Mongoose schemas define MongoDB documents.

This keeps HTTP concerns separate from business logic and persistence.

---

# 8. Authentication Workflow

The authentication flow is:

```text
                    Login
                      │
                      ▼
              Next.js Login Page
                      │
                      │ POST /auth/login
                      ▼
                NestJS AuthController
                      │
                      ▼
                 AuthService
                      │
                ┌─────┴─────┐
                ▼           ▼
          UsersService   PasswordService
                │           │
                ▼           ▼
             MongoDB     Argon2id
                │
                ▼
          Password verified
                │
                ▼
           JWT generated
                │
                ▼
          Access token
                │
                ▼
             Frontend
```

For subsequent protected API requests:

```text
Authorization: Bearer <JWT>
```

The JWT strategy:

1. Extracts the token from the Authorization header.
2. Verifies the signature.
3. Checks expiration.
4. Loads the user.
5. Rejects the request if the user no longer exists.
6. Rejects the request if the user is not active.
7. Places the authenticated user information on the request.

---

# 9. Authorization Workflow

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to perform this operation?

OpsFlow uses three levels of authorization:

```text
Request
   │
   ▼
JWT Authentication
   │
   ▼
Organization Membership
   │
   ▼
Organization Role
   │
   ▼
@Roles(...)
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
MongoDB
```

The organization membership guard checks:

```text
userId
organizationId
```

and verifies that the authenticated user belongs to that organization.

It then makes the organization role available to the authorization layer.

The roles guard evaluates permissions defined with `@Roles(...)`.

---

# 10. Role Model

OpsFlow uses:

| Permission | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| View organization data | ✓ | ✓ | ✓ |
| Create data | ✓ | ✓ | — |
| Edit data | ✓ | ✓ | — |
| Delete data | ✓ | — | — |
| Manage members | ✓ | ✓ | — |
| Organization settings | ✓ | — | — |

The backend is the actual security boundary.

Frontend permission checks improve the user experience, but an API request is still rejected by backend guards if the user does not have the required permission.

---

# 11. Multi-Tenant Data Isolation

One of the most important architectural decisions in OpsFlow is organization-level data isolation.

Business documents contain an `organizationId`.

For example:

```text
Project
 ├── _id
 ├── organizationId
 ├── name
 └── key
```

When querying data, the organization is included in the database filter.

Conceptually:

```ts
find({
  _id: projectId,
  organizationId: organizationId,
})
```

This prevents a user from simply changing an ID in a URL and accessing another organization's resource.

The authorization chain and database queries therefore work together:

```text
Authentication
      +
Membership
      +
Role
      +
Organization-scoped query
      =
Tenant isolation
```

---

# 12. Example Project Workflow

Suppose a user creates a project.

The request flows like this:

```text
Browser
  │
  │ POST /organizations/:organizationId/projects
  ▼
Next.js
  │
  ▼
RTK Query
  │
  ▼
NestJS
  │
  ├── JWT Auth Guard
  │
  ├── Organization Membership Guard
  │
  ├── Roles Guard
  │
  ▼
ProjectsController
  │
  ▼
ProjectsService
  │
  ├── Validate organization
  ├── Validate project data
  ├── Create MongoDB document
  ├── Write audit record
  │
  ▼
MongoDB
  │
  ▼
Response
  │
  ▼
RTK Query cache invalidation
  │
  ▼
Updated UI
```

This pattern is reused throughout the application.

---

# 13. Tasks and Projects Relationship

Tasks are scoped to both an organization and a project.

```text
Organization
    │
    └── Project
          │
          ├── Task
          ├── Task
          └── Task
```

When creating a task, the backend verifies that:

1. The project exists.
2. The project belongs to the requested organization.
3. An optional assignee belongs to the same organization.
4. The task is created with the correct organization and project IDs.
5. The operation is recorded in the audit trail.

This prevents cross-organization references.

---

# 14. Customer and Ticket Workflow

Customers are organization-owned business records.

Tickets can connect operational information:

```text
Organization
     │
     ├── Customer
     │
     ├── Project
     │
     └── Ticket
           ├── Customer
           ├── Project
           ├── Assignee
           ├── Priority
           └── Status
```

When creating a ticket, the backend verifies related resources belong to the same organization.

For example, a ticket cannot use a customer belonging to another organization.

---

# 15. Redis Caching

Redis is used as a caching layer rather than as the primary database.

The current project caching pattern is implemented for project detail retrieval.

```text
GET Project
     │
     ▼
Redis
     │
 ┌───┴────┐
 │        │
Hit      Miss
 │        │
 ▼        ▼
Return   MongoDB
          │
          ▼
        Redis
          │
          ▼
        Return
```

Project detail cache keys follow the pattern:

```text
project:{organizationId}:{projectId}
```

The project detail cache uses a TTL.

When a project is updated or deleted, its cache entry is invalidated.

This is a cache-aside strategy:

```text
Read:
Cache → Database on miss

Write:
Database → Invalidate cache
```

Redis failures are treated as cache failures rather than database failures, allowing the primary database to remain the source of truth.

---

# 16. MongoDB Indexing

MongoDB indexes were added around common organization-scoped access patterns.

Important indexes include:

```text
OrganizationMember
  organizationId + userId (unique)

Customer
  organizationId + status + createdAt

Project
  organizationId + status + createdAt

Task
  organizationId + createdAt

Ticket
  organizationId + createdAt
```

Project keys also have a unique organization-scoped constraint:

```text
organizationId + key
```

The purpose is to improve common queries while enforcing important business constraints at the database level.

---

# 17. Audit Logging

Audit logging is implemented as a separate backend module.

Business services call the audit service after important operations.

For example:

```text
Create Project
     │
     ├── Save project
     │
     └── AuditService.log(...)
```

A typical audit event contains:

```text
organizationId
userId
action
entity
entityId
metadata
```

This gives the application an operational history rather than relying only on the current state of the database.

---

# 18. API Response Format

OpsFlow uses a consistent response envelope.

Successful responses follow the structure:

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-09-29T06:35:28.041Z"
}
```

Errors follow a structured format containing information such as:

```text
success
statusCode
message
path
timestamp
```

This consistency makes frontend API handling easier.

---

# 19. Validation and Error Handling

Incoming API data is validated through DTOs using `class-validator`.

Examples include:

```text
@IsString()
@IsEmail()
@IsMongoId()
@IsOptional()
@IsIn(...)
@Length(...)
@MaxLength(...)
@IsDateString()
```

The backend also uses centralized exception handling so errors are returned in a predictable structure.

This prevents every controller from implementing its own error-response format.

---

# 20. Health Checks

OpsFlow has two health endpoints.

## Liveness

```text
GET /health/live
```

Purpose:

> Is the API process alive?

It does not depend on MongoDB or Redis.

Example:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "..."
  },
  "timestamp": "..."
}
```

## Readiness

```text
GET /health/ready
```

Purpose:

> Is the API ready to serve traffic?

It checks:

```text
MongoDB → up/down
Redis   → up/down
```

Example:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "services": {
      "mongodb": "up",
      "redis": "up"
    }
  },
  "timestamp": "..."
}
```

If a required dependency is unavailable, readiness returns a service-unavailable response while liveness can continue to report that the process itself is alive.

---

# 21. Automated Testing

The backend contains a broad unit-test suite covering the major services and controllers.

The tested areas include:

```text
AuthService
UsersService
OrganizationsController
OrganizationsService
OrganizationMembersService
CustomersService
ProjectsService
TasksService
TicketsService
CommentsService
AuditService
DashboardService
PasswordService
RedisService
AppService
```

The project reached approximately **200 passing backend tests** during the development process.

Testing is run with:

```powershell
pnpm --filter api test
```

Coverage can be generated with:

```powershell
pnpm --filter api test:cov
```

---

# 22. Docker Architecture

The infrastructure is containerized with Docker Compose.

The main services are:

```text
┌──────────────────────────────┐
│       Docker Compose         │
│                              │
│  ┌──────────┐  ┌──────────┐ │
│  │ MongoDB  │  │  Redis   │ │
│  │ :27017   │  │  :6379   │ │
│  └──────────┘  └──────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │      NestJS API        │ │
│  │        :3000           │ │
│  └────────────────────────┘ │
└──────────────────────────────┘
```

The API Docker image uses a multi-stage build:

```text
Base
  ↓
Dependencies
  ↓
Build
  ↓
Production dependencies
  ↓
Production runtime
```

This keeps build tooling out of the final runtime image and produces a smaller production-oriented container.

---

# 23. Development Environment

During normal development:

```text
Next.js       → local :3001
NestJS        → local :3000
MongoDB       → Docker :27017
Redis         → Docker :6379
```

Frontend:

```powershell
pnpm --filter web dev
```

Backend:

```powershell
pnpm --filter api start:dev
```

Infrastructure:

```powershell
docker compose up
```

The Docker API can be stopped while keeping MongoDB and Redis running when developing the backend locally.

This gives hot reload for the application code while keeping infrastructure services containerized.

---

# 24. Production-Oriented Environment

For deployment-style testing, the API can run inside Docker:

```text
Next.js
   │
   ▼
Dockerized API
   │
   ├── MongoDB container
   └── Redis container
```

An important networking distinction is:

### Local application

```text
localhost:27017
localhost:6379
```

### API running inside Docker

```text
mongodb:27017
redis:6379
```

Docker services communicate using their Compose service names rather than `localhost`.

---

# 25. Environment Variables

The application uses environment variables for configuration and secrets.

Examples include:

```env
MONGODB_URI=...
JWT_ACCESS_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
REDIS_HOST=...
REDIS_PORT=6379
NEXT_PUBLIC_API_URL=...
```

Secrets should not be committed to source control.

For local development, environment files are used.

For deployment, secrets should be supplied through the deployment environment or secret-management mechanism.

---

# 26. Important Security Decisions

OpsFlow was deliberately built with several security boundaries.

### Password security

Passwords are never stored as plain text.

They are hashed using Argon2id.

### JWT security

Access tokens:

- Are signed with a server-side secret.
- Have an expiration period.
- Are validated on every protected request.

### Account status

A suspended/inactive account cannot continue using the API merely because it possesses an otherwise valid JWT.

The JWT validation flow checks the current user record.

### Tenant isolation

Business queries include organization scope.

### Authorization

The backend verifies organization membership and role.

### Validation

Incoming request data is validated through DTOs.

### Database constraints

Important uniqueness rules are enforced through MongoDB indexes.

---

# 27. Authorization Matrix

The core permission model is:

```text
                    Owner     Admin     Member
------------------------------------------------
View                  ✓         ✓         ✓
Create                ✓         ✓         -
Edit                  ✓         ✓         -
Delete                ✓         -         -
Manage members        ✓         ✓         -
Settings              ✓         -         -
```

This is enforced on the backend.

The frontend can hide unavailable actions for usability, but the backend remains the authoritative security layer.

---

# 28. Example End-to-End Request

Consider:

> An admin updates a project.

The complete flow is:

```text
1. User clicks "Edit Project"
             │
             ▼
2. Next.js form collects data
             │
             ▼
3. RTK Query sends PATCH request
             │
             ▼
4. NestJS receives request
             │
             ▼
5. JWT Auth Guard
   verifies identity
             │
             ▼
6. Organization Membership Guard
   verifies organization membership
             │
             ▼
7. Roles Guard
   verifies owner/admin permission
             │
             ▼
8. ProjectsController
             │
             ▼
9. ProjectsService
             │
             ├── validates organization scope
             ├── updates MongoDB
             ├── invalidates Redis project cache
             └── creates audit record
             │
             ▼
10. API response
             │
             ▼
11. RTK Query invalidates relevant cache
             │
             ▼
12. Next.js displays updated project
```

This is one of the strongest architectural stories to explain during an interview because it demonstrates frontend, API, security, database, caching, and audit logging working together.

---

# 29. Why This Architecture?

The project intentionally separates responsibilities.

### Next.js

Responsible for:

- User interface
- Routing
- Forms
- Client-side API interaction
- UI state
- API caching

### NestJS

Responsible for:

- Authentication
- Authorization
- Validation
- Business rules
- Tenant isolation
- Database operations
- Audit logging
- Health checks

### MongoDB

Responsible for:

- Persistent application data
- Organizations
- Users
- Memberships
- Projects
- Tasks
- Customers
- Tickets
- Comments
- Audit records

### Redis

Responsible for:

- Frequently accessed cached data
- Reducing repeated database reads
- Future extensibility for queues/background processing

### Docker

Responsible for:

- Consistent infrastructure
- Reproducible environments
- Containerized API deployment
- MongoDB and Redis services

---

# 30. Project Structure — Conceptual View

```text
opsflow/
│
├── apps/
│   │
│   ├── api/
│   │   └── src/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── organizations/
│   │       ├── organization-members/
│   │       ├── projects/
│   │       ├── tasks/
│   │       ├── customers/
│   │       ├── tickets/
│   │       ├── comments/
│   │       ├── audit/
│   │       ├── dashboard/
│   │       ├── redis/
│   │       ├── health/
│   │       ├── database/
│   │       └── common/
│   │
│   └── web/
│       └── src/
│           ├── app/
│           ├── components/
│           ├── features/
│           └── store/
│
├── packages/
├── docker/
├── docs/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

# 31. Interview Introduction — 30 Seconds

A concise way to introduce OpsFlow is:

> **"OpsFlow is a full-stack, multi-tenant operations management platform that I built using Next.js, NestJS, MongoDB, Redis, and Docker. The idea was to bring common business operations such as organization management, projects, tasks, customers, support tickets, team members, comments, and audit logging into one platform. I designed the backend as a modular NestJS application with JWT authentication, organization-level tenant isolation, role-based authorization, validation, Redis caching, and automated tests. The frontend is built with Next.js and Redux Toolkit with RTK Query for API communication and caching. I also containerized the infrastructure with Docker Compose and added health and readiness checks."**

---

# 32. Interview Introduction — 1–2 Minutes

If the interviewer asks you to explain the project in more detail:

> **"OpsFlow is an enterprise-style operations management platform and my main goal was to build something that demonstrates real-world full-stack architecture rather than just CRUD functionality.**
>
> **The frontend is built with Next.js and TypeScript. I use Redux Toolkit and RTK Query for application state and API communication. The UI is organized around features such as organizations, projects, tasks, customers, tickets, comments, and members.**
>
> **The backend is built with NestJS and MongoDB using Mongoose. I separated the backend into business modules so authentication, users, organizations, memberships, projects, tasks, customers, tickets, comments, audit logging, dashboard functionality, Redis, and health checks have clear responsibilities.**
>
> **Authentication uses JWT and Argon2id password hashing. After authentication, requests go through an authorization chain. First the JWT guard identifies the user, then the organization membership guard verifies that the user belongs to the requested organization, and finally the roles guard checks whether the user's organization role is allowed to perform the operation.**
>
> **Multi-tenancy is enforced by including organizationId in business data and database queries. So authorization is not only a frontend concern; the backend remains the security boundary.**
>
> **I also introduced Redis as a cache for frequently accessed project data. The application follows a cache-aside approach, and the cache is invalidated when the project changes. MongoDB remains the source of truth.**
>
> **Finally, I added automated backend tests, MongoDB indexes, Docker Compose infrastructure, a multi-stage Docker build for the API, and health/readiness endpoints. So the project demonstrates the complete path from frontend UI through authentication and authorization to business logic, database, caching, testing, and deployment infrastructure."**

---

# 33. Questions an Interviewer May Ask

## Why did you choose NestJS?

A good answer:

> "I wanted a backend framework with strong architectural conventions. NestJS gives me modules, controllers, services, dependency injection, guards, decorators, validation integration, and a structure that works well for a larger business application."

## Why MongoDB?

> "The application has several document-oriented business entities and MongoDB works naturally with Mongoose schemas. It also allowed me to model organization-scoped documents while using indexes for the main access patterns."

## Why Redis if MongoDB already works?

> "Redis is not replacing MongoDB. MongoDB is the source of truth. Redis reduces repeated reads for frequently accessed data. I implemented a cache-aside pattern with TTL and invalidation on updates and deletes."

## Why RTK Query?

> "RTK Query handles API request state, caching, generated hooks, and cache invalidation. It reduces repetitive frontend data-fetching code and keeps server-state management separate from ordinary UI state."

## How do you prevent one organization from seeing another organization's data?

> "There are multiple layers. The JWT identifies the user, the membership guard verifies that the user belongs to the requested organization, the roles guard verifies the permission, and the service/database query includes organizationId in the filter. The backend is therefore enforcing tenant isolation."

## What happens when a JWT belongs to a deleted or suspended user?

> "The JWT strategy doesn't trust the token alone. It loads the current user from MongoDB. If the user no longer exists or is not active, the request is rejected."

## What happens if Redis goes down?

> "Redis is treated as a cache, not the source of truth. Cache operations fail gracefully and the application can fall back to MongoDB for reads. That prevents a cache outage from becoming a complete application outage."

## How did you approach testing?

> "I created service and controller tests around the major business modules and also tested Redis-related behavior. The backend reached approximately 200 passing tests during development."

## How would you deploy this application?

> "The application is already structured for containerized deployment. The API has a multi-stage Dockerfile, MongoDB and Redis are defined in Docker Compose, configuration is supplied through environment variables, and the API exposes liveness and readiness endpoints. The next deployment step would be running the frontend and API in a production environment with managed database/cache services or appropriately managed containers."

---

# 34. The Most Important Architecture Story to Remember

If you forget everything else during an interview, remember this:

```text
                    USER
                     │
                     ▼
               Next.js UI
                     │
                     ▼
              RTK Query API
                     │
                     ▼
               NestJS API
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   Authentication         Authorization
          │                     │
       JWT               Membership + Role
          │                     │
          └──────────┬──────────┘
                     ▼
               Business Logic
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       MongoDB     Redis      Audit
       Source      Cache       Trail
       of Truth
```

The key sentence is:

> **"The frontend initiates the operation, NestJS authenticates and authorizes it, the service applies the business rules, MongoDB remains the source of truth, Redis accelerates selected reads, and audit logging records important business actions."**

That sentence explains the heart of OpsFlow.

---

# 35. Current Local URLs

During development:

```text
Frontend
http://localhost:3001

Backend
http://localhost:3000

API liveness
http://localhost:3000/health/live

API readiness
http://localhost:3000/health/ready

MongoDB
localhost:27017

Redis
localhost:6379
```

---

# 36. Development Commands

From the repository root:

### Start frontend

```powershell
pnpm --filter web dev
```

### Start backend

```powershell
pnpm --filter api start:dev
```

### Run backend tests

```powershell
pnpm --filter api test
```

### Build backend

```powershell
pnpm --filter api build
```

### Start Docker infrastructure

```powershell
docker compose up
```

### Build and start Docker deployment

```powershell
docker compose up --build
```

---

# 37. Final Project Summary

OpsFlow demonstrates a complete full-stack application architecture:

```text
Frontend
   ↓
Next.js + TypeScript
   ↓
Redux Toolkit + RTK Query
   ↓
REST API
   ↓
NestJS
   ↓
JWT + Argon2id
   ↓
Membership + RBAC
   ↓
Business Services
   ↓
MongoDB
   +
Redis Cache
   +
Audit Trail
   ↓
Docker Infrastructure
   ↓
Health / Readiness
   ↓
Deployment
```

The most important engineering principles demonstrated by the project are:

- Separation of concerns
- Modular backend architecture
- Feature-oriented frontend architecture
- Authentication and authorization
- Multi-tenant data isolation
- Server-side validation
- Database constraints and indexing
- Cache-aside Redis caching
- Auditability
- Automated testing
- Containerization
- Health and readiness monitoring
- Production-oriented configuration

---

## OpsFlow in one sentence

> **OpsFlow is a multi-tenant full-stack business operations platform built with Next.js, NestJS, MongoDB, Redis, and Docker, designed to demonstrate real-world authentication, authorization, business workflows, caching, auditing, testing, and deployment architecture.**
