# Inventory Management API

A RESTful inventory and operations backend built with **Node.js, Express, PostgreSQL, Redis, and JavaScript**.

The project focuses primarily on learning and implementing backend engineering concepts including:

- REST API design
- PostgreSQL database design
- SQL and relational data modeling
- Transactions and concurrency control
- Authentication
- Server-side session management
- Role-Based Access Control (RBAC)
- Permission-based authorization
- Input validation
- Centralized error handling
- Redis integration
- API documentation
- Automated testing

---

# Features

- Product management
- Category management
- Supplier management
- Warehouse management
- Customer management
- Inventory management
- Inventory adjustments
- Stock movement tracking
- Inventory availability checks
- Low-stock detection
- Inventory summaries
- Order management
- Order item management
- Order processing and cancellation
- Order total calculations
- PostgreSQL transactions
- Row-level locking for concurrency-sensitive operations
- User registration
- Account verification
- Password hashing with Argon2
- Redis-backed server-side sessions
- HTTP-only session cookies
- Session expiration
- Login and logout
- Authentication middleware
- Role-Based Access Control (RBAC)
- Permission-based authorization
- Role and permission management
- Owner-level account administration
- Secure default role assignment during registration
- Schema-based request validation
- Centralized error handling
- Swagger/OpenAPI documentation
- Unit tests for validation and authorization

---

# Tech Stack

## Backend

- Node.js
- Express 5
- JavaScript
- CommonJS

## Database

- PostgreSQL
- `pg`

## Authentication and Security

- Argon2
- Cookie-based authentication
- Redis sessions
- HTTP-only cookies
- RBAC
- Permission-based authorization
- Schema-based input validation

## Infrastructure

- Redis
- Nodemailer

## API Documentation

- Swagger
- OpenAPI
- `swagger-jsdoc`
- `swagger-ui-express`

## Testing

- Node.js built-in test runner
- `node:test`
- `node:assert/strict`

---

# Architecture

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
  ├── Validation Middleware
  │
  ▼
Controllers
  │
  ▼
Services
  │
  ├── PostgreSQL
  │
  ├── Redis
  │
  └── SMTP
```

The application separates HTTP routing, authentication, authorization, validation, controller logic, and reusable service/database operations.

---

# Application

The main Express application configures:

- Express
- Middleware
- Cookie parsing
- Swagger/OpenAPI
- Application routers
- Global error handling

The application itself does not contain the business logic for every operation. Controllers and services are responsible for handling application behavior.

---

# Server

`server.js` is responsible for starting the application and establishing required external connections before accepting requests.

The application depends primarily on:

- PostgreSQL
- Redis
- SMTP for email-related functionality

---

# Controllers

Controllers handle HTTP/application-level operations.

They are responsible for:

- Receiving validated request data
- Calling the appropriate services
- Handling application logic related to the request
- Returning HTTP responses

Controllers are separated from reusable database/service operations to reduce duplication.

---

# Routers

Routers define the API endpoints and connect requests to the appropriate controllers.

Protected routes use authentication middleware.

Where applicable, authorization middleware checks whether the authenticated account has the required permission before the controller executes.

Example authorization flow:

```text
Request
  ↓
Authentication
  ↓
Permission Check
  ↓
Validation
  ↓
Controller
  ↓
Service
  ↓
Database
```

---

# Authentication

Authentication is session-based rather than JWT-based.

The general authentication flow is:

```text
Registration
    ↓
Password Hashing
    ↓
Account Creation
    ↓
Default Customer Role Assignment
    ↓
Verification
    ↓
Login
    ↓
Redis Session Creation
    ↓
HTTP-only Session Cookie
    ↓
Authentication Middleware
```

Passwords are hashed using **Argon2** rather than being stored directly.

The server determines the user's authenticated identity from the session rather than trusting an account identifier supplied by the client.

---

# Session Management

Sessions are stored server-side using Redis.

The client receives a session identifier through an HTTP cookie.

Session behavior includes:

- Server-side session storage
- Cryptographically generated session identifiers
- Redis session expiration
- HTTP-only cookies
- `SameSite=Lax`
- Environment-dependent `Secure` cookie configuration
- Session deletion during logout
- Cookie clearing during logout

The basic model is:

```text
Client
  │
  │ Session Cookie
  ▼
Express
  │
  │ Session ID
  ▼
Redis
  │
  ▼
Authenticated Account
```

The session itself is not stored inside the client.

---

# Authorization and RBAC

The application uses **Role-Based Access Control (RBAC)**.

The authorization model is:

```text
Account
   │
   ▼
account_roles
   │
   ▼
Role
   │
   ▼
role_permissions
   │
   ▼
Permission
```

An account receives permissions through its assigned roles.

For example:

```text
Account
   ↓
Inventory Manager
   ↓
inventory.read
inventory.create
inventory.update
inventory.remove
inventory.low_stock
inventory.adjust
inventory.summary
```

Authorization is implemented through reusable permission-checking logic and middleware.

---

# Roles

The current role model includes:

- Owner
- Product Manager
- Category Manager
- Customer Manager
- Supplier Manager
- Warehouse Manager
- Inventory Manager
- Ordering Manager
- Customer

Roles are intended to represent application capabilities rather than being hardcoded into individual route handlers.

---

# Owner Role

The `Owner` role provides administrative capabilities over sensitive account and authorization operations.

Owner-level functionality includes management of:

- Roles
- Account-role assignments
- Authorization configuration

Additional protections are used around Owner-role assignment to reduce the risk of accidental or unauthorized removal of the final Owner.

---

# Registration Security

Users cannot choose arbitrary privileged roles during registration.

A newly registered account receives the application's default **Customer** role server-side.

The intended security model is:

```text
Client
  │
  │ Registration
  ▼
Server
  │
  ├── Create Account
  │
  └── Assign Customer Role
```

The client does not control its initial privileged access level.

---

# Access Control

The project currently implements **operation-level authorization** through RBAC and permissions.

For example:

```text
product.read
product.create
product.update
product.remove
```

and:

```text
inventory.read
inventory.create
inventory.update
inventory.remove
inventory.adjust
```

However, **resource-level access control is not yet fully implemented**.

RBAC answers:

> "Is this account allowed to perform this type of operation?"

Resource-level authorization additionally answers:

> "Is this account allowed to perform this operation on this particular resource?"

The second layer remains part of the project's security roadmap.

---

# Database

PostgreSQL stores the application's persistent data.

Major data domains include:

- Accounts
- Roles
- Permissions
- Account-role assignments
- Role-permission assignments
- Products
- Categories
- Suppliers
- Warehouses
- Customers
- Inventory
- Orders
- Order items
- Stock movements
- Verification-related data

Database access is separated into reusable services where appropriate.

Request-controlled SQL values are passed through parameterized queries.

Generic database helpers may construct SQL using application-controlled identifiers such as table or column names. These identifiers must remain controlled by application code and must never become client-controlled input.

---

# Inventory Concurrency

Inventory operations can involve concurrent requests modifying the same stock.

Important inventory operations therefore use database transactions and row-level locking where required.

The general pattern is:

```text
BEGIN
  ↓
Lock Relevant Row
  ↓
Read Current State
  ↓
Validate Operation
  ↓
Update Inventory
  ↓
Record Related Changes
  ↓
COMMIT
```

If an operation fails, the transaction can be rolled back so that the related database changes do not leave the inventory in an inconsistent state.

This provides database-level consistency and concurrency protection.

---

# Validation

The application uses reusable schema-based validation middleware.

Validation can operate on:

- Request body
- Route parameters
- Query parameters

Supported validation features include:

- Required fields
- Type checking
- Trimming
- Minimum length
- Maximum length
- Regular-expression patterns
- Integer validation
- Minimum values
- Maximum values
- Finite-number validation
- Email validation
- Enumerations
- Custom validation
- Field inequality checks

Invalid requests are rejected before reaching the relevant controller.

This provides a centralized validation mechanism instead of duplicating validation logic throughout individual controllers.

---

# Error Handling

The application uses centralized error handling to provide consistent HTTP error responses.

Application-specific errors can be propagated through the service/controller layers and handled by the global error middleware.

This keeps error formatting and HTTP response behavior more consistent across routes.

---

# API Documentation

Swagger/OpenAPI documentation is available through:

```text
/api-docs
```

When the server is running locally:

```text
http://localhost:<PORT>/api-docs
```

The documentation provides an interactive interface for exploring the API endpoints and their request/response structures.

---

# Environment Configuration

Environment-specific configuration is loaded through environment variables.

Typical configuration includes:

- PostgreSQL connection information
- Redis connection information
- Session expiration
- SMTP configuration
- Cookie security configuration
- Owner-role configuration
- Default Customer-role configuration

Secrets and environment-specific credentials should not be committed to the repository.

A `.env.example` file can be used to document the expected configuration without exposing actual secrets.

---

# Running Locally

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Create a `.env` file using the project's expected environment variables.

Do not commit real secrets to Git.

## 3. Start PostgreSQL

Make sure PostgreSQL is running and the configured database is available.

## 4. Start Redis

Make sure Redis is running and accessible using the configured connection settings.

## 5. Start the API

```bash
npm start
```

The server will start using `server.js`.

---

# Testing

The project uses Node.js's built-in test runner.

The configured scripts are:

```json
"scripts": {
  "start": "node server.js",
  "test": "node --test",
  "watch": "node --test --watch"
}
```

## Run Tests Once

```bash
npm test
```

This executes the test suite and exits after the tests finish.

## Watch Mode

```bash
npm run watch
```

Watch mode automatically reruns the tests when relevant files change.

It is primarily useful during active development and debugging.

## Current Tests

The project currently contains tests covering areas such as:

- Authorization
- Input validation

The testing system is still being expanded toward broader integration and security testing.

---

# Security Model

The current security architecture includes:

- Argon2 password hashing
- Account verification
- Server-side Redis sessions
- HTTP-only session cookies
- Session expiration
- Authentication middleware
- RBAC
- Permission-based authorization
- Role and permission management
- Owner-level administration
- Secure default Customer role assignment
- Parameterized SQL values
- Schema-based input validation
- Centralized error handling
- PostgreSQL transactions
- Row-level locking for concurrency-sensitive operations
- Authorization unit tests
- Validation unit tests

---

# Current Security Limitations

The following areas are not yet fully implemented or finalized:

- Resource-level access control
- Comprehensive authorization integration testing
- Rate limiting
- Explicit CORS policy
- Dedicated CSRF protection
- Production-grade secrets management
- Comprehensive automated security testing
- Full secure API design review
- Production deployment hardening

JWT and OAuth 2.0 are not currently implemented.

They are not required by the current session-based authentication architecture and remain optional future architectural choices rather than unfinished prerequisites.

---

# Project Structure

```text
inventory-system/
│
├── controllers/
│
├── middlewares/
│
├── routers/
│
├── services/
│
├── tests/
│   └── unit/
│       └── security/
│
├── app.js
├── server.js
├── package.json
├── swagger.js
├── .env.example
└── README.md
```

The exact directory structure may expand as additional application and testing modules are added.

---

# Known Limitations

This is an actively developed backend project.

Current limitations include:

- Resource-level authorization is not fully implemented.
- Rate limiting has not yet been implemented.
- Explicit CORS configuration has not yet been finalized.
- Dedicated CSRF protection has not yet been implemented.
- Production secrets management requires further hardening.
- Automated security testing is still being expanded.
- Integration testing across the complete API is not yet comprehensive.
- Production deployment configuration is not finalized.
- `npm test` now runs the Node test runner, but the test suite itself is still being expanded.

---

# Project Status

## Backend Engineering

Implemented:

- REST API
- Express
- PostgreSQL
- SQL
- CRUD operations
- Relational database design
- Database relationships
- Transactions
- Row-level locking
- Reusable services
- Redis
- Session management
- API documentation

## Security

Implemented:

- Authentication
- Argon2 password hashing
- Account verification
- Server-side sessions
- HTTP-only cookies
- Session expiration
- Input validation
- Authentication middleware
- RBAC
- Permission-based authorization
- Role management
- Permission management
- Owner administration
- Default role assignment
- Privilege-escalation protections
- Parameterized SQL values
- Transactional database operations
- Authorization testing
- Validation testing

## Next Security Stage

The current security progression is:

```text
Authentication
      ↓
Authorization / RBAC
      ↓
Resource-Level Access Control
      ↓
Authorization Integration Testing
      ↓
Rate Limiting
      ↓
Secure API Review
      ↓
Deployment-Specific CORS / CSRF / Secrets Controls
```

JWT and OAuth 2.0 remain optional architectural alternatives rather than required steps in the current authentication system.

---

# Project Philosophy

The project is primarily a **learning and engineering project**.

The objective is not simply to produce an API that works.

The objective is to understand why the system works and how its components interact:

```text
Learn
  ↓
Implement
  ↓
Explain
  ↓
Debug
  ↓
Modify
  ↓
Test
  ↓
Improve
```

The project therefore prioritizes understanding backend architecture, database behavior, security boundaries, concurrency, and software engineering principles over simply maximizing the number of features.
