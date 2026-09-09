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
- Role-based access control (RBAC)
- Role and permission management
- Permission-based route authorization
- Owner role administration
- Secure default Customer role assignment during registration
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
Authorization Middleware
  ↓
Controllers
  ↓
Services
  ↓
PostgreSQL / Redis / SMTP
```

### Application

`app.js` configures the Express application, middleware, Swagger documentation, routers, authentication, authorization, and global error handling.

### Server

`server.js` is responsible for starting the application and establishing required external connections before accepting requests.

### Controllers

Controllers contain the HTTP request handling and business logic for resources such as products, inventory, orders, suppliers, customers, and RBAC administration.

### Routers

Routers define the API endpoints and connect them to the appropriate controllers.

Protected routers use authentication and permission middleware before requests reach the controllers.

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
- Authorization checks

## Authentication

The API implements session-based authentication.

The authentication flow is:

```text
Registration
    ↓
Password hashing
    ↓
Customer record creation
    ↓
Account creation
    ↓
Customer role assignment
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

New registrations are automatically assigned the `customer` role. The client cannot select a privileged role during registration.

## Session Management

Sessions are stored in Redis with a configurable expiration time.

The client receives only the session ID through an HTTP-only cookie.

The authentication middleware retrieves the session from Redis and attaches the authenticated user's session information to `req.user`.

Logging out deletes the server-side session and clears the session cookie.

## Authorization and RBAC

The API implements role-based access control (RBAC).

The authorization model consists of:

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

The system currently defines these roles:

- Owner
- Product Manager
- Category Manager
- Customer Manager
- Supplier Manager
- Warehouse Manager
- Inventory Manager
- Ordering Manager
- Customer

Permissions represent individual application capabilities, such as:

```text
product.read
product.create
product.update
product.delete

inventory.read
inventory.adjust
inventory.summary

order.read
order.create
order.process
order.cancel

role.read
role.create
role.delete
account.role.grant
account.role.revoke
```

Protected routes use authorization middleware to verify that the authenticated account has the required permission.

For example:

```text
GET /products
        ↓
authenticate
        ↓
requirePermission("product.read")
        ↓
products controller
```

### Owner Role

The Owner is the highest-privilege RBAC role.

The Owner currently has all defined application permissions, including role and account-role administration.

Owner-only functionality includes:

- Reading roles
- Creating roles
- Deleting roles
- Reading permissions assigned to roles
- Granting permissions to roles
- Revoking permissions from roles
- Reading an account's roles
- Granting roles to accounts
- Revoking roles from accounts

The system protects the Owner role from deletion and prevents the final Owner assignment from being removed.

### Registration Security

Public registration does not allow the requester to select a role.

New accounts are assigned:

```text
role_id = Customer
```

server-side as part of the registration transaction.

This prevents a client from attempting to register directly as an Owner or another privileged role.

## Access Control

RBAC determines whether an account has permission to perform an operation.

Resource-level access control determines whether the account is allowed to perform that operation on a particular resource.

For example:

```text
Customer
  order.read
      ↓
only their own orders

Ordering Manager
  order.read
      ↓
all orders
```

Resource ownership checks are the next major authorization layer.

They will be used to prevent attacks such as changing an identifier in a request to access or modify another customer's data.

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
- Roles
- Permissions
- Account-role assignments
- Role-permission assignments
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
- Role and permission identifiers must be valid positive integers

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
- Owner role ID
- Customer role ID

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
- Role-based access control
- Permission-based authorization
- Owner role administration
- Server-side default Customer role assignment
- Centralized error handling
- Database transactions
- Row-level locking for inventory operations

## Current Security Limitations

Resource-level ownership checks are not yet fully implemented.

For example, a customer may have the `order.read` permission, but the application still needs resource-level checks to guarantee that the requested order actually belongs to that customer.

Other planned security improvements include:

- Resource-level access control
- Rate limiting
- CORS configuration
- CSRF protection
- Secrets management improvements
- Automated security testing
- Secure API design review

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

The current project is primarily focused on learning and implementing backend engineering and security concepts.

Current limitations include:

- Resource-level ownership checks are not yet implemented
- Rate limiting is not yet implemented
- CORS configuration is not yet implemented
- CSRF protection is not yet implemented
- Some database responses still expose broader fields than a production API would normally return
- Some reusable database helpers still need further refinement
- Production deployment configuration has not yet been finalized
- Automated security testing is not yet fully implemented

## Project Status

The project currently demonstrates:

### Backend Engineering

- REST API design
- Express.js
- PostgreSQL
- SQL
- CRUD operations
- Database relationships
- Transactions
- Concurrency control
- Row-level locking
- Reusable service functions

### Security

- Authentication
- Password hashing
- Account verification
- Session management
- Redis
- HTTP-only cookies
- Input validation
- Authorization
- RBAC
- Role and permission management
- Owner administration
- Privilege-escalation protection
- Security analysis
