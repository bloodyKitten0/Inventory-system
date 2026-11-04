# Inventory Management System

A production-oriented REST API for inventory and operations management, built with **Node.js, TypeScript, Express, PostgreSQL, Redis, and SMTP**.

The project is designed to demonstrate practical backend engineering rather than simple CRUD implementation. Its current scope includes relational data modeling, transactional operations, concurrency control, session-based authentication, RBAC authorization, reusable validation, automated testing, and API documentation.

> **Project status:** Active development. The core backend architecture is implemented; production hardening, integration testing, resource-level authorization, and operational infrastructure remain in progress.

---

## Core Capabilities

The API currently provides:

- Product management
- Category management
- Supplier management
- Warehouse management
- Customer management
- Product-supplier relationships
- Inventory management
- Inventory summaries
- Low-stock detection
- Stock availability checks
- Stock adjustments
- Stock movement history
- Order management
- Order item management
- Order processing
- Order cancellation
- Order status management
- Order totals and detailed order queries
- Account registration
- Account verification
- Password hashing with Argon2
- Redis-backed server-side sessions
- HTTP-only session cookies
- Authentication middleware
- Role-Based Access Control (RBAC)
- Permission-based authorization
- Role management
- Permission management
- Account-role assignment
- Schema-based request validation
- Centralized error handling
- PostgreSQL transactions
- Row-level locking for concurrency-sensitive operations
- Swagger/OpenAPI documentation
- Automated TypeScript tests

---

# Technology Stack

## Runtime

- Node.js
- TypeScript
- ECMAScript Modules (ESM)

The repository uses native ESM semantics with TypeScript's `NodeNext` module configuration. Source imports therefore use `.js` specifiers even though the source files themselves are `.ts`.

## HTTP Layer

- Express 5
- `cookie-parser`

## Database

- PostgreSQL
- `pg`

## Authentication and Security

- Argon2
- Redis-backed sessions
- HTTP-only cookies
- `SameSite=Lax`
- Configurable `Secure` cookies
- RBAC
- Permission-based authorization
- Verification-token hashing with SHA-256
- Parameterized SQL values
- Request validation

## Infrastructure

- Redis
- Nodemailer / SMTP

## API Documentation

- Swagger / OpenAPI 3
- `swagger-jsdoc`
- `swagger-ui-express`

## Testing

- Node.js built-in test runner
- `node:test`
- `node:assert/strict`
- TypeScript-compiled test files

---

# Architecture

The application follows a layered backend structure:

```text
Client
  │
  ▼
Express Application
  │
  ├── Routers
  │
  ├── Authentication Middleware
  │
  ├── Authorization Middleware
  │
  └── Validation Middleware
  │
  ▼
Controllers
  │
  ├── HTTP behavior
  ├── Business rules
  └── Transactional operations
  │
  ▼
Reusable Services
  │
  ├── PostgreSQL
  ├── Redis sessions
  ├── Password hashing
  ├── Verification tokens
  └── Email
  │
  ▼
External Systems
  ├── PostgreSQL
  ├── Redis
  └── SMTP
```

The repository deliberately keeps routing, request validation, authentication, authorization, controllers, and reusable infrastructure concerns separate.

---

# Project Structure

```text
Inventory-system/
│
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   └── redis.ts
│   │
│   ├── constants/
│   │   └── order-status.ts
│   │
│   ├── controllers/
│   │   ├── categories.ts
│   │   ├── customers.ts
│   │   ├── inventory.ts
│   │   ├── orders.ts
│   │   ├── orders-items.ts
│   │   ├── products.ts
│   │   ├── products-suppliers.ts
│   │   ├── roles.ts
│   │   ├── stock-movements.ts
│   │   ├── suppliers.ts
│   │   └── warehouses.ts
│   │
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── authorization.ts
│   │   └── validate.ts
│   │
│   ├── routers/
│   │   ├── auth.ts
│   │   ├── categories.ts
│   │   ├── customers.ts
│   │   ├── inventory.ts
│   │   ├── orders.ts
│   │   ├── orders-items.ts
│   │   ├── products.ts
│   │   ├── products-suppliers.ts
│   │   ├── roles.ts
│   │   ├── stock-movements.ts
│   │   ├── suppliers.ts
│   │   └── warehouses.ts
│   │
│   ├── security/
│   │   ├── auth.ts
│   │   ├── authorization.ts
│   │   └── security.md
│   │
│   ├── services/
│   │   ├── email.ts
│   │   ├── password-hashing.ts
│   │   ├── read-all.ts
│   │   ├── read-id.ts
│   │   ├── read-relation.ts
│   │   ├── remove.ts
│   │   ├── rows-check.ts
│   │   ├── sessions.ts
│   │   ├── try-catch.ts
│   │   └── verification-token.ts
│   │
│   ├── tests/
│   │   ├── helpers.ts
│   │   └── unit/
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── security/
│   │       ├── services/
│   │       └── validators/
│   │
│   ├── types/
│   │   └── express.d.ts
│   │
│   ├── validators/
│   │   ├── auth.ts
│   │   ├── categories.ts
│   │   ├── common.ts
│   │   ├── customers.ts
│   │   ├── inventory.ts
│   │   ├── order-items.ts
│   │   ├── orders.ts
│   │   ├── product-suppliers.ts
│   │   ├── products.ts
│   │   ├── roles.ts
│   │   ├── Stock-movements.ts
│   │   ├── suppliers.ts
│   │   └── warehouses.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── schema.sql
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env.example
└── readme.md
```

The project deliberately keeps compiled output in `dist/`, which is generated during the build rather than committed as source.

---

# Request Processing

A typical protected request follows this sequence:

```text
HTTP Request
    ↓
Express
    ↓
Authentication
    ↓
Authorization
    ↓
Validation
    ↓
Controller
    ↓
Reusable Service / PostgreSQL
    ↓
HTTP Response
```

The exact middleware sequence varies by route, but protected application resources use authentication and permission checks before controller execution.

---

# Authentication

Authentication is session-based rather than JWT-based.

### Registration Flow

```text
Client Registration
      ↓
Input Validation
      ↓
Create Customer
      ↓
Hash Password with Argon2
      ↓
Create Account
      ↓
Assign Customer Role
      ↓
Generate Verification Token
      ↓
Hash Verification Token
      ↓
Store Token Hash + Expiration
      ↓
Send Verification Email
      ↓
Commit Transaction (Atomic Rollback on Email Failure)
```

After verification, the account can log in.

### Administrator Bootstrap

When setting up a new deployment with no existing accounts, the initial Administrator account with the Owner role can be created via:

```text
POST /auth/bootstrap
```

This endpoint creates an active administrator account with the Owner role directly, guarded by a database check that rejects requests if an Owner account already exists (`403 Forbidden`).

### Login Flow

```text
Email + Password
      ↓
Normalize Email to Lowercase
      ↓
Find Account
      ↓
Verify Argon2 Password Hash
      ↓
Confirm Active Account
      ↓
Generate Session ID
      ↓
Store Session in Redis (with Validated SESSION_TTL)
      ↓
Set HTTP-only Cookie (Cookie maxAge matches SESSION_TTL)
```

The server therefore identifies the authenticated account from the server-side session rather than trusting an account ID supplied by the client. Session cookies and Redis TTL are kept synchronized, and disabled accounts immediately lose access through active-status checks during authorization.

---

# Session Management

Sessions are stored in Redis.

Each session consists of a server-generated random identifier and server-side session data.

```text
Client
  │
  │ Cookie: sessionId
  ▼
Express
  │
  │ session ID
  ▼
Redis
  │
  ▼
Authenticated Account
```

Session identifiers are generated using cryptographically secure random bytes.

Session records expire through Redis TTL.

The authentication cookie currently uses:

- `httpOnly: true`
- `sameSite: "lax"`
- Environment-controlled `secure`
- A 24-hour cookie lifetime

The Redis TTL is independently configured through the environment.

---

# Authorization

The system implements Role-Based Access Control.

The relationship is:

```text
Account
   ↓
account_roles
   ↓
Role
   ↓
role_permissions
   ↓
Permission
```

Permissions are operation-specific.

Examples:

```text
product.read
product.create
product.update
product.delete
```

```text
inventory.read
inventory.create
inventory.update
inventory.delete
inventory.adjust
inventory.summary
inventory.low_stock
```

```text
order.read
order.create
order.update
order.delete
order.process
order.cancel
order.update_status
```

The current system provides operation-level authorization across all domain resources.

### Resource-level authorization

Resource-level authorization protects customer-owned resources from unauthorized access:

- Customer accounts have their associated `customerId` bound to their server-side session.
- When an authenticated customer accesses `/orders`, `/orders/:id`, `/orders/:id/details`, `/orders/:id/total`, `/orders/:id/cancel`, `/orders/customer/:id`, or creates order items, the system verifies that the order's `customer_id` matches the authenticated customer's ID (`req.user.customerId`).
- Cross-tenant customer access attempts return `403 Forbidden`.
- Customer role users are granted self-service order workflow permissions (`order.read`, `order.create`, `order.cancel`, `order.details`, `order.total`, `order_item.create`, `order_item.read`, `product.read`, `category.read`).

---

# Roles

The database seeds the following roles:

- Owner
- Product Manager
- Category Manager
- Customer Manager
- Supplier Manager
- Warehouse Manager
- Inventory Manager
- Ordering Manager
- Customer

The Owner role is protected by strict invariants:
- Permissions cannot be revoked from the Owner role (`403 Forbidden`).
- The last account holding the Owner role cannot be revoked, guarded against race conditions with atomic conditional checks.
- When `OWNER_ID` is not explicitly set in the environment, the system dynamically discovers the Owner role ID from the database.

---

# Validation

Request validation is implemented through reusable schemas.

The validator supports:

- Required fields
- Type checks
- String trimming rules
- Minimum length
- Maximum length
- Regular expressions
- Integer requirements
- Minimum values
- Maximum values
- Finite-number checks
- Enumerations
- Custom validation
- Inequality checks
- Email validation

Validation is applied to:

- Request bodies
- Route parameters
- Query parameters

Route and query numeric strings can be coerced to numbers before validation when the schema expects a number.

The middleware returns a structured `400 Bad Request` response containing all detected validation errors.

---

# Database Design

PostgreSQL is the primary persistent store.

The schema contains the following major domains:

```text
Accounts
Roles
Permissions
Account Roles
Role Permissions
Customers
Products
Categories
Suppliers
Product-Supplier Relationships
Warehouses
Inventory
Stock Movements
Orders
Order Items
Verification Tokens
```

The database also contains:

- Primary keys
- Foreign keys
- Unique constraints
- Check constraints
- Cascading deletes where appropriate
- Query indexes

Examples include:

- Unique product/warehouse inventory records
- Unique product/supplier relationships
- Non-negative inventory amounts
- Non-negative product prices
- Positive order-item quantities
- Restricted order-status values

---

# Transactions and Concurrency

Inventory-changing operations use PostgreSQL transactions when multiple state changes must remain consistent.

A stock adjustment follows this conceptual sequence:

```text
BEGIN
  ↓
SELECT inventory row FOR UPDATE
  ↓
Validate current stock
  ↓
Modify inventory
  ↓
Create stock movement
  ↓
COMMIT
```

Order processing follows the same general principle:

```text
BEGIN
  ↓
Lock order
  ↓
Verify order state
  ↓
Read order items
  ↓
Lock required inventory rows
  ↓
Validate stock
  ↓
Deduct inventory
  ↓
Record SALE movements
  ↓
Update order state
  ↓
COMMIT
```

The purpose is to prevent race conditions in which concurrent requests independently observe stale inventory values.

---

# Inventory

The inventory subsystem is mounted under the `/inventory` router prefix. It supports:

- Inventory records
- Product-level inventory queries
- Warehouse-level inventory queries
- Total inventory summaries (returns `[]` on empty collection)
- Single-product summaries
- Low-stock queries (returns `[]` on empty collection)
- Availability checks (requires positive quantity)
- Stock adjustments

All stock mutations record accurate stock ledger movements:
- Initial stock creation records a `RECEIPT` movement with reason `'Initial stock'`.
- Stock adjustments record `ADJUSTMENT` movements with reason `'Stock adjustment increase'` or `'Stock adjustment decrease'`.
- Manual inventory updates record `RECEIPT` (increase) or `SALE` (decrease) movements reflecting the delta.
- Deleting inventory with positive stock writes off remaining stock recording an `ADJUSTMENT` movement before row removal.

Inventory quantities must be non-negative integers and amounts are constrained at the database level (`CHECK (amount >= 0)`).

---

# Orders

The orders subsystem is mounted under the `/orders` router prefix.

Orders follow a strict lifecycle:

```text
pending ──(process)──► processing ──► completed
   │                       │
   └──(cancel)─────────────┴───────► cancelled
```

### Available Endpoints

- `GET /orders` - Read orders (scoped to customer if authenticated as a customer)
- `POST /orders` - Create a pending order
- `GET /orders/:id` - Read order by ID
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order (reverses stock if processing)
- `GET /orders/customer/:id` - Read orders for a customer
- `GET /orders/warehouse/:id` - Read orders for a warehouse
- `GET /orders/:id/details` - Read order items with product details (returns `[]` if order has no items)
- `GET /orders/:id/total` - Calculate order total price (returns `{ order_id, total: "0" }` if empty)
- `POST /orders/:id/process` - Atomically process an order and deduct inventory
- `PATCH /orders/:id/status` - Update order status
- `PATCH /orders/:id/cancel` - Cancel an order (restores stock if processing)

### Order Lifecycle Invariants

- **Processing Requirements**: Orders can only transition to `processing` via `POST /orders/:id/process`. Direct status changes to `processing` via `PUT` or `PATCH` are rejected (`400 Bad Request`).
- **Pending Reversion**: Once processed, orders cannot be reset to `pending` (`400 Bad Request`).
- **Identity Immutability**: Customer ID and Warehouse ID cannot be reassigned once an order has been processed.
- **Stock Restoration**: Cancelling or deleting an order in `processing` status restores deducted inventory to the warehouse and logs `RECEIPT` movements in the stock ledger.
- **Order Items Protection**: Order items cannot be added, updated, or deleted on orders that are in `processing`, `completed`, or `cancelled` state.
- **Canonical Pricing**: When adding items to orders, prices are looked up from the `products` table rather than trusting client-provided prices.
- **Deadlock Avoidance**: Order processing locks inventory rows in deterministic ascending order (`ORDER BY product_id ASC`) to eliminate concurrency deadlocks under high load.

---

# Stock Movements

The stock movements subsystem is mounted under the `/stock-movements` router prefix. Stock movements provide historical audit records of all inventory changes.

Movement types are:

```text
RECEIPT
SALE
ADJUSTMENT
```

Movement records include:

- `id`: Unique movement identifier
- `product_id`: Product reference
- `warehouse_id`: Warehouse reference
- `movement_type`: `RECEIPT`, `SALE`, or `ADJUSTMENT`
- `quantity`: Positive integer quantity moved
- `reference_id`: Associated business reference ID (e.g. order ID, inventory ID)
- `reason`: Human-readable audit description (e.g. "Order fulfillment", "Stock adjustment increase", "Inventory deletion write-off")
- `created_at`: Timestamp of movement

The movement table is an append-only ledger and is not exposed to deletion.

---

# API Documentation

Swagger/OpenAPI documentation is served at:

```text
/api-docs
```

The documentation server dynamically adapts using the environment:

- Respects `process.env.BASE_URL` or defaults to `http://localhost:${PORT || 3000}`
- Supports relative path routing (`/`) for reverse proxy compatibility

The documentation is generated from route-level OpenAPI annotations in the TypeScript router files.

---

# Configuration

Environment-specific configuration is stored outside the source code.

A template is provided in:

```text
.env.example
```

The current configuration includes:

```env
DB_USER=
DB_HOST=
DB_NAME=
DB_PASSWORD=
DB_PORT=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

REDIS_URL=
SESSION_TTL=
COOKIE_SECURE=

OWNER_ID=
CUSTOMER_ID=
```

Do not commit real credentials, API keys, passwords, or production secrets.

---

# Installation

Install dependencies:

```bash
npm install
```

Create the environment configuration:

```bash
cp .env.example .env
```

Then configure PostgreSQL and Redis according to the environment variables.

Initialize the database using:

```text
schema.sql
```

---

# Build

Compile the TypeScript source:

```bash
npm run build
```

The compiler writes generated JavaScript and declaration/source-map artifacts to:

```text
dist/
```

---

# Start

The production-style start script runs the compiled server:

```bash
npm start
```

The normal sequence for a fresh checkout is therefore:

```bash
npm install
npm run build
npm start
```

---

# Development

The repository currently exposes:

```bash
npm run dev
```

which invokes the configured TypeScript development entry point.

Because the project uses native ESM and `NodeNext`, the development execution path should be kept aligned with the TypeScript/Node runtime configuration as the project evolves.

---

# Testing

Run the current test suite with:

```bash
npm test
```

The test command first compiles the TypeScript project and then executes the generated JavaScript test files.

Watch mode is available through:

```bash
npm run watch
```

The repository currently contains parallel JavaScript and TypeScript test files.

The TypeScript suite is the active compiled test path; the legacy JavaScript copies are retained in the repository but are not required for the current TypeScript build.

---

# Test Coverage

The repository currently contains unit tests across:

```text
Controllers
Middleware
Security
Services
Validators
```

The test suite verifies substantial application behavior, including:

- Validation behavior
- Authorization
- Authentication
- Session handling
- Password hashing
- Verification tokens
- Generic database services
- Inventory operations
- Order processing
- Controller behavior
- Validator boundaries

The next testing stage is integration and end-to-end verification against real PostgreSQL, Redis, and HTTP requests.

---

# Security Posture

Current security controls include:

- Argon2 password hashing
- Account verification
- Cryptographically generated session identifiers
- Redis-backed sessions
- HTTP-only cookies
- `SameSite=Lax`
- Optional secure cookies
- RBAC
- Permission-based authorization
- Default Customer role assignment
- Protected Owner administration
- Parameterized SQL values
- Database constraints
- Request validation
- PostgreSQL transactions
- Row-level locking
- Security-focused unit tests

---

# Current Limitations

The following items remain areas for future enhancement:

### Testing

- PostgreSQL integration tests
- Redis integration tests
- HTTP/API integration tests
- End-to-end authentication flows
- Real concurrency tests
- Failure/recovery tests
- Database constraint tests

### API Security

- Rate limiting
- Explicit CORS policy
- Dedicated CSRF defense
- Broader security review
- Production secret-management strategy

### Operations

- Startup environment validation
- Health/readiness endpoints
- Graceful shutdown
- Structured logging
- Monitoring
- Production deployment configuration
- Recovery procedures

### Performance

- Pagination
- Query-performance measurement
- `EXPLAIN ANALYZE` review
- More deliberate index optimization
- Load/concurrency benchmarking

---

# Engineering Direction

The project is intentionally evolving beyond a basic REST API.

The current progression is:

```text
CRUD
  ↓
Relational Modeling
  ↓
Reusable Services
  ↓
Authentication
  ↓
RBAC
  ↓
Validation
  ↓
Transactions
  ↓
Concurrency Control
  ↓
TypeScript
  ↓
Integration Testing
  ↓
Resource-Level Authorization
  ↓
Performance Engineering
  ↓
Production Deployment
  ↓
Observability / Recovery
```

The objective is not merely to accumulate endpoints.

The objective is to demonstrate that the system remains correct under invalid input, concurrent requests, unauthorized access, database failures, and operational stress.

---

# Project Philosophy

This repository is both a software project and an engineering learning project.

The intended workflow is:

```text
Understand
   ↓
Implement
   ↓
Explain
   ↓
Test
   ↓
Break
   ↓
Debug
   ↓
Measure
   ↓
Improve
```

The emphasis is on understanding the mechanisms behind the system:

- Why transactions are required
- Why row locking matters
- Where authentication ends and authorization begins
- How validation affects trust boundaries
- How PostgreSQL constraints protect invariants
- How Redis is used for server-side sessions
- How TypeScript expresses the contracts between layers
- How tests provide evidence rather than merely increasing coverage numbers

---

# License

This project is licensed under the [ISC License](LICENSE).
