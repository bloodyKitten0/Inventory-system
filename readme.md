# Inventory Management API

A RESTful inventory management backend built with Node.js, Express, and PostgreSQL.

The project manages products, warehouses, suppliers, customers, inventory levels, orders, order items, and stock movement history.

## Features

- Product management
- Category management
- Supplier management
- Warehouse management
- Customer management
- Inventory management
- Order management
- Order item management
- Stock movement tracking
- Inventory adjustments
- Stock availability checks
- Low-stock detection
- Inventory summaries
- Order processing
- Order cancellation
- Order totals
- Transaction-safe inventory operations
- Row-level locking for concurrent inventory operations
- User registration and account verification
- Password hashing with Argon2
- Redis-backed server-side sessions
- HTTP-only session cookies
- Login and logout
- Authentication middleware
- Input validation
- Centralized error handling
- Swagger API documentation

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- `pg`
- Redis
- Argon2
- Nodemailer
- Swagger / OpenAPI
- JavaScript

## Architecture

The application is separated into several layers:

```text
Client
  ↓
Express Routers
  ↓
Authentication Middleware
  ↓
Controllers
  ↓
Services
  ↓
PostgreSQL / Redis / SMTP
```

### Application

`app.js` configures the Express application, middleware, Swagger documentation, routers, authentication, and global error handling.

### Server

`server.js` is responsible for starting the application and establishing required external connections before accepting requests.

### Controllers

Controllers contain the HTTP request handling and business logic for resources such as products, inventory, orders, suppliers, and customers.

### Routers

Routers define the API endpoints and connect them to the appropriate controllers.

### Services

Reusable functionality is separated into services for operations such as:

- Database reads
- Database deletion
- Relationship queries
- Error handling
- Password hashing
- Session management
- Verification tokens
- Email delivery

## Authentication

The API implements session-based authentication.

The authentication flow is:

```text
Registration
    ↓
Password hashing
    ↓
Account creation
    ↓
Verification token
    ↓
Verification email
    ↓
Account verification
    ↓
Login
    ↓
Redis session creation
    ↓
HTTP-only session cookie
    ↓
Authentication middleware
```

Passwords are hashed with Argon2 rather than stored as plaintext.

Verification tokens are randomly generated and hashed before being stored in PostgreSQL.

Authenticated sessions are stored server-side in Redis and referenced by a cryptographically random session ID.

## Session Management

Sessions are stored in Redis with a configurable expiration time.

The client receives only the session ID through an HTTP-only cookie.

The authentication middleware retrieves the session from Redis and attaches the authenticated user's session information to `req.user`.

Logging out deletes the server-side session and clears the session cookie.

## Database

PostgreSQL stores the application's persistent data, including:

- Accounts
- Customers
- Products
- Categories
- Suppliers
- Warehouses
- Inventory
- Orders
- Order items
- Stock movements
- Product-supplier relationships
- Verification tokens

Database values supplied by requests are passed through parameterized SQL queries.

## Inventory Concurrency

Inventory-changing operations use PostgreSQL transactions and row-level locking where necessary.

For example, stock adjustment follows the general pattern:

```text
BEGIN
  ↓
Lock inventory row
  ↓
Check available stock
  ↓
Update inventory
  ↓
Record stock movement
  ↓
COMMIT
```

This helps prevent concurrent operations from producing inconsistent inventory quantities.

## Validation

The API validates client-controlled input before performing database operations.

Examples include:

- IDs must be valid positive integers
- Prices must be finite non-negative numbers
- Quantities must satisfy the relevant inventory rules
- Names must be valid strings
- Emails must have a valid format
- Required fields must be present
- Addresses must contain valid non-empty values

Validation is currently implemented directly in controllers and will eventually be further organized into reusable validation middleware.

## API Documentation

Swagger / OpenAPI documentation is available through the application's API documentation endpoint.

When running locally:

`/api-docs`

## Environment Configuration

The application uses environment variables for configuration such as:

- PostgreSQL connection details
- Redis connection URL
- Session expiration
- SMTP configuration
- Cookie security configuration

Sensitive credentials should be stored in `.env` and must not be committed to the repository.

A `.env.example` file can be used to document the required environment variables without exposing actual credentials.

## Running Locally

Install the project dependencies:

```bash
npm install
```

Configure the required environment variables in `.env`.

Make sure PostgreSQL and Redis are running.

Then start the server:

```bash
node server.js
```

The API will start on the configured application port.

## Security Model

Current security controls include:

- Input validation
- Parameterized SQL queries
- Password hashing with Argon2
- Account verification
- Hashed verification tokens
- Redis-backed sessions
- Cryptographically random session IDs
- HTTP-only cookies
- Session expiration
- Authentication middleware
- Centralized error handling
- Database transactions
- Row-level locking for inventory operations

### Current Limitations

Authorization is not yet implemented.

The application can authenticate a user, but it does not yet fully determine whether that authenticated user is authorized to perform every operation or access every resource.

Rate limiting is also not yet implemented.

These are planned security improvements.

## Project Structure

```text
inventory-system/
├── config/
├── controllers/
├── middlewares/
├── routers/
├── security/
├── services/
├── app.js
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## Known Limitations

The current project is primarily focused on learning and implementing backend engineering concepts.

Current limitations include:

- Authorization / RBAC is not yet implemented
- Resource ownership checks are not yet implemented
- Rate limiting is not yet implemented
- Some database responses still expose broader fields than a production API would normally return
- Some reusable database helpers still need further refinement
- Production deployment configuration has not yet been finalized

## Project Status

The project currently demonstrates:

**Backend Engineering**

- REST API design
- Express.js
- PostgreSQL
- SQL
- CRUD operations
- Database relationships
- Transactions
- Concurrency control
- Row-level locking

**Security**

- Authentication
- Password hashing
- Account verification
- Session management
- Redis
- HTTP-only cookies
- Input validation
- Security analysis

**Next Major Security Step**

```text
Authentication
    ↓
Authorization
    ↓
RBAC
    ↓
Resource Ownership
    ↓
Rate Limiting
```
