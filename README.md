# Smart Government Service Navigator — Backend API

A RESTful backend API built with **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL** to help citizens easily find and navigate government services in Bangladesh.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| Password | bcryptjs |
| Security | Helmet, CORS |

---

## Project Structure

```
smart-gov-navigator/
├── prisma/
│   ├── schema.prisma        # Database schema (10 entities)
│   └── seed.ts              # Database seeder
├── src/
│   ├── config/
│   │   └── db.ts            # Prisma client
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── categoryController.ts
│   │   ├── serviceController.ts
│   │   ├── stepController.ts
│   │   ├── documentController.ts
│   │   ├── officeController.ts
│   │   ├── serviceOfficeController.ts
│   │   ├── bookmarkController.ts
│   │   └── feedbackController.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts     # JWT verification
│   │   ├── roleMiddleware.ts     # RBAC (Admin/User)
│   │   └── errorMiddleware.ts    # Global error handler
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   ├── serviceRoutes.ts
│   │   ├── officeRoutes.ts
│   │   ├── bookmarkRoutes.ts
│   │   ├── feedbackRoutes.ts
│   │   └── adminRoutes.ts
│   ├── types/
│   │   └── index.ts             # Custom TypeScript types
│   ├── utils/
│   │   ├── jwt.ts               # Token helpers
│   │   ├── response.ts          # API response helpers
│   │   └── validate.ts          # Validation utilities
│   └── server.ts                # App entry point
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd smart-gov-navigator
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/smart_gov_navigator"
JWT_SECRET="your_super_secret_jwt_key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed initial data (roles, admin user, sample service)
npm run db:seed
```

### 4. Run the Server

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

---

## Default Admin Credentials (after seeding)

```
Email:    admin@govnavigator.com
Password: admin123456
```

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/logout` | Auth | Logout |
| GET | `/auth/me` | Auth | Get current user |

### User Profile
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users/profile` | Auth | Get my profile |
| PUT | `/users/profile` | Auth | Update my profile |
| DELETE | `/users/account` | Auth | Delete my account |

### Service Categories
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/categories` | Public | Get all categories |
| GET | `/categories/:id` | Public | Get category by ID |
| POST | `/admin/categories` | Admin | Create category |
| PUT | `/admin/categories/:id` | Admin | Update category |
| DELETE | `/admin/categories/:id` | Admin | Delete category |

### Services
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/services` | Public | Get all services (paginated) |
| GET | `/services/:id` | Public | Get service detail |
| GET | `/services/search?q=keyword` | Public | Search services |
| GET | `/services/category/:id` | Public | Filter by category |
| GET | `/services/:id/steps` | Public | Get service steps |
| GET | `/services/:id/documents` | Public | Get required documents |
| GET | `/services/:id/offices` | Public | Get offices for service |
| GET | `/services/:id/feedbacks` | Public | Get service feedbacks |
| POST | `/admin/services` | Admin | Create service |
| PUT | `/admin/services/:id` | Admin | Update service |
| DELETE | `/admin/services/:id` | Admin | Delete service |
| POST | `/admin/services/:id/steps` | Admin | Add step |
| PUT | `/admin/steps/:id` | Admin | Update step |
| DELETE | `/admin/steps/:id` | Admin | Delete step |
| POST | `/admin/services/:id/documents` | Admin | Add document |
| PUT | `/admin/documents/:id` | Admin | Update document |
| DELETE | `/admin/documents/:id` | Admin | Delete document |

### Government Offices
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/offices` | Public | Get all offices |
| GET | `/offices?district=Dhaka` | Public | Filter by district |
| GET | `/offices?upazila=Kaliganj` | Public | Filter by upazila |
| GET | `/offices/:id` | Public | Get office by ID |
| POST | `/admin/offices` | Admin | Create office |
| PUT | `/admin/offices/:id` | Admin | Update office |
| DELETE | `/admin/offices/:id` | Admin | Delete office |

### Service-Office Mapping
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/admin/service-offices` | Admin | Map service to office |
| DELETE | `/admin/service-offices/:id` | Admin | Remove mapping |

### Bookmarks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/bookmarks` | Auth | Get my bookmarks |
| POST | `/bookmarks` | Auth | Add bookmark |
| DELETE | `/bookmarks/:id` | Auth | Remove bookmark |

### Feedbacks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/feedbacks` | Auth | Submit feedback |
| PUT | `/feedbacks/:id` | Auth | Update own feedback |
| DELETE | `/feedbacks/:id` | Auth | Delete own feedback |
| GET | `/admin/feedbacks` | Admin | Get all feedbacks |
| DELETE | `/admin/feedbacks/:id` | Admin | Delete any feedback |

---

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Database Entities

| Entity | Description |
|--------|-------------|
| `roles` | Admin / User roles |
| `users` | System users |
| `service_categories` | Service groupings |
| `services` | Government services |
| `service_steps` | Step-by-step guides |
| `required_documents` | Documents needed per service |
| `government_offices` | Government office locations |
| `service_offices` | Service ↔ Office mapping |
| `bookmarks` | User saved services |
| `feedbacks` | User ratings and reviews |

---

## Business Rules

- **One feedback per user per service** — a user can only submit one review per service (can update it)
- **One bookmark per user per service** — duplicate bookmarks are rejected
- **Rating range** — must be between 1 and 5
- **Owner-only updates** — users can only edit/delete their own feedback and bookmarks
- **Admin moderation** — admins can delete any feedback
- **Cascade deletes** — deleting a service removes its steps, documents, and office mappings

---

## Available npm Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled production server
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Regenerate Prisma client
npm run db:seed      # Seed initial data
npm run db:studio    # Open Prisma Studio (GUI)
```

---

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "message": "Operation successful.",
  "data": { }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description.",
  "errors": []
}
```
