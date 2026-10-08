# Security Model

This document describes the security architecture, trust boundaries, assets, attack surfaces, implemented controls, known limitations, and remaining security work for the Inventory Management System.

The goal is to distinguish clearly between:

1. Security controls that are currently implemented.
2. Controls that reduce risk but do not eliminate it.
3. Security properties that remain incomplete.

The application uses **TypeScript, Express, PostgreSQL, Redis, Argon2, HTTP-only cookies, RBAC, and schema-based request validation**.

---

# 1. Security Objectives

The principal security objectives are:

```text
Confidentiality
    +
Integrity
    +
Availability
```

### Confidentiality

Prevent unauthorized users from reading protected information.

Examples:

- Customer information
- Account information
- Orders
- Supplier information
- Inventory data
- Stock movement history
- Authorization configuration

### Integrity

Prevent unauthorized or invalid modifications to application state.

Examples:

- Inventory quantities
- Order state
- Product pricing
- Role assignments
- Permission assignments
- Customer information
- Stock movement history

### Availability

Ensure that legitimate users can continue to use the system and that malicious input cannot trivially exhaust application or infrastructure resources.

Availability remains less mature than confidentiality and integrity because rate limiting, load controls, monitoring, and production recovery mechanisms are not yet fully implemented.

---

# 2. Assets

## Accounts

Accounts contain:

- Username
- Email
- Password hash
- Account status
- Customer relationship
- Assigned roles

**Security objectives:** Confidentiality / Integrity

---

## Authentication System

The authentication subsystem determines whether a request belongs to a valid authenticated account.

It includes:

- Password verification
- Account verification
- Session creation
- Session lookup
- Session deletion

**Security objectives:** Confidentiality / Integrity / Availability

---

## Sessions

Session data is stored server-side in Redis.

The client possesses only the session identifier.

**Security objectives:** Confidentiality / Integrity

---

## Customer Information

Customer records include:

- Customer name
- Customer email
- Shipping address
- Account relationship

**Security objectives:** Confidentiality / Integrity

A major remaining requirement is resource-level authorization so that access to a customer or customer-owned resource can be evaluated against the authenticated account.

---

## Products

Products contain:

- Name
- Category
- Description
- Price

**Security objectives:** Integrity / Confidentiality

Pricing and product data must only be modified by authorized roles.

---

## Inventory

Inventory contains current quantities for products across warehouses.

**Security objective:** Integrity

Inventory is especially sensitive because concurrent modifications can create incorrect quantities if not synchronized correctly.

---

## Stock Movement History

Stock movements record inventory changes.

**Security objectives:** Integrity / Confidentiality

The history represents a record of operational activity and therefore should not be casually mutable.

---

## Orders

Orders contain:

- Customer
- Warehouse
- Status
- Order creation time

**Security objectives:** Confidentiality / Integrity

Orders also represent business state, making lifecycle integrity particularly important.

---

## Order Items

Order items contain:

- Order
- Product
- Quantity
- Price

**Security objectives:** Confidentiality / Integrity

Order-item mutation requires special treatment after inventory has already been consumed.

---

## Roles and Permissions

Authorization configuration determines what accounts can do.

**Security objectives:** Confidentiality / Integrity

Compromise of role or permission management can produce privilege escalation across the entire application.

---

## Database

The PostgreSQL database contains nearly all persistent application state.

**Security objectives:** Confidentiality / Integrity / Availability

---

## Redis

Redis stores authenticated session information.

**Security objectives:** Confidentiality / Availability / Integrity

---

# 3. Trust Boundaries

## Client → API

The client is untrusted.

Potentially malicious input includes:

- JSON request bodies
- Route parameters
- Query parameters
- Cookies
- Credentials
- Verification tokens

Client input must therefore never be assumed trustworthy merely because it passed through an HTTP framework.

---

## API → PostgreSQL

The API is responsible for transforming untrusted request input into database operations.

Parameterized SQL values are used for request-controlled values.

Generic reusable SQL helpers also construct table and column identifiers dynamically. Those identifiers are intended to come only from trusted application code and must never become client-controlled strings.

---

## API → Redis

The API communicates with Redis for server-side sessions.

Session identifiers are generated by the server using cryptographically secure randomness.

The client does not directly define the authenticated account stored in the session.

---

## API → SMTP

The authentication system sends verification email through an SMTP transport.

SMTP configuration contains credentials and therefore belongs entirely in environment configuration rather than source control.

---

# 4. Authentication Architecture

The application uses session-based authentication.

It does not currently use JWT-based authentication.

The system follows this model:

```text
Credentials
    ↓
Password Verification
    ↓
Account Status Check
    ↓
Random Session ID
    ↓
Redis Session
    ↓
HTTP-only Cookie
```

---

# 5. Password Security

Passwords are processed with Argon2.

The application stores the resulting password hash rather than plaintext passwords.

The login process verifies the submitted password against the stored Argon2 hash.

This provides significantly stronger protection against offline password attacks than plaintext or fast unsalted hashing.

### Remaining considerations

Password hashing does not defend against:

- Credential theft
- Phishing
- Session theft
- Online brute-force attacks

Rate limiting and broader authentication hardening therefore remain necessary.

---

# 6. Account Verification

New accounts receive a verification token.

The system:

1. Generates a cryptographically random token.
2. Hashes the token with SHA-256.
3. Stores the hash rather than the raw token.
4. Associates the token with the account.
5. Assigns an expiration time.
6. Sends the raw token through email.
7. Deletes the verification token after successful verification.

The raw token is therefore not stored in the database.

---

# 7. Session Security

Session identifiers are generated using cryptographically secure random bytes.

Session data is stored server-side:

```text
session:<random-id>
    ↓
Redis
    ↓
{ userId: ... }
```

The client receives only the random session identifier.

Redis expiration provides server-side session expiry.

The session cookie is configured with:

```text
httpOnly = true
sameSite = "lax"
secure = configurable
```

### Why this matters

`httpOnly` prevents ordinary browser JavaScript from directly reading the cookie.

`SameSite=Lax` reduces many cross-site request scenarios.

The `Secure` attribute can require HTTPS in the appropriate deployment environment.

### Remaining limitations

The current implementation does not include:

- Dedicated CSRF tokens
- Session rotation after sensitive security events
- Global session revocation
- Authentication rate limiting
- Session inventory/management for users

---

# 8. Authentication Middleware

Protected routes use authentication middleware.

The middleware:

```text
1. Reads sessionId from the cookie.
2. Rejects missing session IDs.
3. Looks up the session in Redis.
4. Rejects invalid or expired sessions.
5. Attaches authenticated session information to req.user.
```

This establishes identity before authorization.

Authentication and authorization are intentionally separate concerns.

---

# 9. Authorization Architecture

Authorization uses RBAC.

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

The permission-checking query verifies whether the authenticated account possesses a specific permission.

Example:

```text
inventory.adjust
```

The route middleware can therefore answer:

> Does this account have permission to perform this operation?

---

# 10. Operation-Level vs Resource-Level Authorization

This distinction is critical.

### Operation-level authorization

Example:

```text
inventory.update
```

means:

> This account may update inventory records.

### Resource-level authorization

Would additionally ask:

> May this account update inventory record #184?

The current system primarily implements the first layer.

The second layer is incomplete.

---

# 11. Resource-Level Authorization Gap

Resource-level authorization should eventually be applied to resources such as:

- Customers
- Orders
- Order items
- Accounts
- Other user-associated records

For example:

```text
Authenticated Customer
        ↓
GET /orders/125
        ↓
Does order 125 belong to this customer?
        ↓
Allow / Deny
```

Changing `/orders/125` to `/orders/126` must not grant access merely because the requester possesses a general read permission.

This remains one of the most important security improvements in the project.

---

# 12. Registration Privilege Protection

Users cannot select arbitrary roles during registration.

Instead:

```text
Registration
   ↓
Server creates account
   ↓
Server assigns Customer role
```

The client's request therefore cannot directly request:

```text
Owner
```

or another privileged role.

This prevents a straightforward privilege-escalation path during account creation.

---

# 13. Owner Protections

The Owner role controls sensitive authorization-management operations.

Current protections include:

- Preventing deletion of the configured Owner role
- Preventing removal of the final Owner assignment
- Restricting role/permission management through authorization middleware
- Assigning the default Customer role server-side during registration

These protections are intended to prevent accidental administrative lockout and straightforward privilege escalation.

Further hardening is still appropriate around owner lifecycle management.

---

# 14. Input Validation

The validation middleware defines reusable schemas for request data.

Supported controls include:

- Required values
- Types
- Minimum length
- Maximum length
- Regular expressions
- Integer requirements
- Minimum values
- Maximum values
- Finite numbers
- Enumerations
- Custom validation
- Inequality restrictions
- Email validation

Validation operates on:

```text
body
params
query
```

Numeric route parameters and query parameters can be coerced before numerical validation.

---

# 15. SQL Injection Protection

User-controlled SQL values are passed through PostgreSQL parameter placeholders.

Example:

```sql
WHERE id = $1
```

rather than constructing:

```text
WHERE id = <raw user input>
```

This substantially reduces conventional SQL injection risk through ordinary query values.

---

# 16. Dynamic SQL Identifiers

Several generic services construct SQL using application-supplied identifiers such as:

```text
table names
column names
```

Examples include reusable read and delete helpers.

These values are currently supplied by trusted application code.

The security rule is therefore:

```text
Safe:
application-controlled identifier
        ↓
generic SQL helper

Unsafe:
client input
        ↓
table / column identifier
```

The generic service layer should continue to ensure that client-controlled identifiers can never reach those interpolation points.

An explicit allowlist would provide an additional defensive layer.

---

# 17. Database Constraints

Security and integrity are not enforced solely at the HTTP layer.

The database also enforces invariants using:

- Primary keys
- Foreign keys
- Unique constraints
- Check constraints
- Cascading deletes
- Indexes

Examples:

```text
inventory.amount >= 0
price >= 0
quantity >= 1
supplier_price >= 0
```

Order status is constrained to the known state set.

This creates a second line of defense beneath application logic.

---

# 18. Transactional Integrity

Inventory adjustments use PostgreSQL transactions.

The system locks the relevant inventory row with:

```sql
FOR UPDATE
```

before reading and changing its quantity.

The conceptual sequence is:

```text
BEGIN
  ↓
Acquire row lock
  ↓
Read current stock
  ↓
Validate requested change
  ↓
Update inventory
  ↓
Insert stock movement
  ↓
COMMIT
```

If a failure occurs:

```text
ROLLBACK
```

is executed.

This prevents the inventory quantity from being committed without the corresponding stock movement.

---

# 19. Order Processing Security

Order processing also uses a transaction and row locking.

The flow is approximately:

```text
BEGIN
  ↓
Lock order
  ↓
Confirm order is pending
  ↓
Read order items
  ↓
Lock inventory rows
  ↓
Check stock
  ↓
Deduct inventory
  ↓
Record SALE movements
  ↓
Set order to processing
  ↓
COMMIT
```

This is a meaningful concurrency-control mechanism rather than merely a CRUD operation.

---

# 20. Current Integrity Risks

Several important business invariants remain insufficiently protected.

## Order state transitions

The API currently allows arbitrary status values from the allowed status set rather than enforcing a strict lifecycle.

That means an order may potentially move through an invalid sequence such as:

```text
pending
  ↓
processing
  ↓
pending
```

A subsequent processing operation could consume inventory again.

The long-term solution is a state-transition policy rather than simply validating that the new value belongs to the enum.

---

## Order-item mutation after processing

Order items remain independently mutable.

Changing:

```text
quantity
price
product
```

after inventory has already been consumed can cause the order's recorded contents and the inventory's historical effects to diverge.

The system therefore needs a stricter lifecycle boundary around processed orders.

---

## Inventory history completeness

Inventory `adjust` and order processing create stock-movement records.

However, direct inventory creation/update operations can alter quantities without necessarily producing equivalent movement history.

That weakens the auditability of inventory changes.

A production design should establish one authoritative mechanism for changing stock.

---

## Lock-order determinism

Order processing locks inventory rows while iterating through order items.

Concurrent transactions that require overlapping rows in different orders can create deadlock conditions in some workloads.

A stronger implementation would acquire required inventory locks in a deterministic order.

---

# 21. Attack Surface

The application's primary attack surfaces are:

### HTTP endpoints

All API endpoints are potentially reachable by malicious clients.

### Authentication

Login, registration, verification, and session handling are exposed to abuse.

### Authorization

Role and permission management is especially sensitive because compromise can expand privileges.

### Request bodies

JSON bodies are client-controlled.

### Route parameters

Identifiers such as:

```text
/product/42
/order/125
/inventory/9
```

are client-controlled.

### Query parameters

Query parameters can influence server behavior and must be validated as untrusted data.

### Cookies

Session identifiers are security-sensitive credentials.

### PostgreSQL

The database contains the authoritative application state.

### Redis

Redis contains authenticated session state.

### SMTP

SMTP credentials are sensitive operational secrets.

---

# 22. Threat Model

## Unauthorized Read

An attacker attempts to access protected resources.

Examples:

- Another customer's data
- Another user's order
- Supplier information
- Inventory information
- Stock movement history

**Controls:**

- Authentication
- Permission-based authorization
- Request validation

**Remaining gap:**

Resource-level authorization.

---

## Unauthorized Creation

An attacker attempts to create data they should not be able to create.

Examples:

- Products
- Orders
- Inventory records
- Roles
- Role assignments

**Controls:**

- Authentication
- Operation-specific permissions
- Server-side default role assignment
- Database constraints

---

## Unauthorized Modification

An attacker attempts to alter protected data.

Examples:

- Product prices
- Inventory
- Orders
- Customers
- Warehouse data
- Roles
- Permissions

**Controls:**

- Authentication
- RBAC
- Validation
- Database constraints
- Transactions for selected operations
- Row-level locking for selected concurrency-sensitive operations

**Remaining gap:**

Resource-level authorization and stronger business-state invariants.

---

## Unauthorized Deletion

An attacker attempts to remove protected data.

**Controls:**

- Authentication
- Operation-specific delete permissions
- Foreign keys
- Cascading constraints where defined

---

## Credential Attack

An attacker attempts to guess or abuse credentials.

**Controls:**

- Argon2 password hashing
- Account verification
- Generic incorrect-password response
- Session expiration

**Remaining gap:**

Rate limiting and broader authentication abuse controls.

---

## Session Theft

An attacker obtains a valid session identifier.

**Controls:**

- Random session IDs
- HTTP-only cookie
- SameSite protection
- Server-side Redis session state
- Session expiration

**Remaining gap:**

Dedicated CSRF strategy and broader session lifecycle controls.

---

## Privilege Escalation

An attacker attempts to acquire permissions they were not granted.

Examples:

- Granting themselves Owner
- Granting themselves permissions
- Modifying another account's roles
- Calling role-management endpoints without authorization

**Controls:**

- RBAC
- Authorization middleware
- Server-side default role
- Owner protections
- Database relationships

**Remaining gap:**

More comprehensive authorization integration tests and stronger administrative invariants.

---

## SQL Injection

An attacker attempts to inject SQL through API input.

**Current defense:**

Parameterized SQL values.

**Important limitation:**

Dynamic identifiers in generic helpers remain trusted-code responsibilities and must never accept arbitrary client input.

---

## Denial of Service

An attacker attempts to consume application or database resources.

Potential vectors include:

- Repeated login attempts
- Unbounded list endpoints
- Expensive database queries
- High request volume
- Large JSON bodies
- Excessive concurrent requests

**Current controls:**

- Database indexes
- Database constraints
- Validation

**Remaining gap:**

- Rate limiting
- Request-size limits
- Pagination
- Query-performance controls
- Monitoring
- Load protection

---

# 23. Security Controls Inventory

| Control                           | Current Status                     |
| --------------------------------- | ---------------------------------- |
| Argon2 password hashing           | **Implemented**                    |
| Account verification              | **Implemented**                    |
| Verification token hashing        | **Implemented**                    |
| Random session IDs                | **Implemented**                    |
| Redis sessions                    | **Implemented**                    |
| HTTP-only cookies                 | **Implemented**                    |
| SameSite cookies                  | **Implemented**                    |
| Secure cookie configuration       | **Implemented**                    |
| Authentication middleware         | **Implemented**                    |
| RBAC                              | **Implemented**                    |
| Permission-based authorization    | **Implemented**                    |
| Server-side default Customer role | **Implemented**                    |
| Owner-role safeguards             | **Implemented**                    |
| Schema-based input validation     | **Implemented**                    |
| Parameterized SQL values          | **Implemented**                    |
| PostgreSQL constraints            | **Implemented**                    |
| Transactions                      | **Implemented for key operations** |
| Row-level locking                 | **Implemented for key operations** |
| Authorization unit tests          | **Implemented**                    |
| Validation unit tests             | **Implemented**                    |
| Resource-level authorization      | **Incomplete**                     |
| Integration security tests        | **Incomplete**                     |
| Rate limiting                     | **Not implemented**                |
| Explicit CORS policy              | **Not implemented**                |
| Dedicated CSRF defense            | **Not implemented**                |
| Production secrets management     | **Incomplete**                     |
| Security monitoring               | **Not implemented**                |
| Production deployment hardening   | **Incomplete**                     |

---

# 24. Testing Strategy

The current repository contains extensive unit tests across:

```text
Controllers
Middleware
Security
Services
Validators
```

These tests provide useful evidence for isolated behavior.

However, unit mocks cannot establish that:

```text
Router
  ↓
Middleware
  ↓
Controller
  ↓
PostgreSQL
  ↓
Redis
```

behaves correctly as a complete system.

The next security-testing stage should therefore include:

### Integration tests

Use real PostgreSQL and Redis instances.

Verify:

- Foreign keys
- Unique constraints
- Transactions
- Rollbacks
- Session TTLs
- Real SQL behavior
- Real authorization queries

### API tests

Execute actual HTTP requests against the Express application.

Verify:

- Authentication boundaries
- Route protection
- Validation
- Authorization
- Correct HTTP status codes
- Cookies

### Concurrency tests

Run concurrent requests against the same:

- Inventory row
- Product/warehouse pair
- Order
- Stock operation

Verify that final state remains correct.

### Failure tests

Deliberately fail:

- Database operations
- Redis access
- SMTP delivery
- Mid-transaction operations

Then confirm the system leaves no partial state.

---

# 25. Security Roadmap

The recommended progression is:

```text
Current
  │
  ├── Authentication
  ├── Session Security
  ├── RBAC
  ├── Validation
  ├── SQL Parameterization
  └── Transactional Inventory Control
  │
  ▼
Next
  │
  ├── Resource-Level Authorization
  ├── Order State Machine
  ├── Immutable/Post-Processing Order Rules
  ├── Authoritative Stock-Movement Model
  └── Concurrency Integration Tests
  │
  ▼
Then
  │
  ├── Rate Limiting
  ├── CSRF Strategy
  ├── Explicit CORS
  ├── Security Headers
  ├── Request Size Controls
  └── Secrets Management
  │
  ▼
Production
  │
  ├── Deployment Hardening
  ├── Structured Logging
  ├── Monitoring
  ├── Health / Readiness Checks
  ├── Graceful Shutdown
  ├── Backup / Recovery
  └── Incident Response
```

---

# 26. Security Engineering Principle

The project should treat security as a set of independent layers:

```text
Validation
    ≠
Authentication
    ≠
Authorization
    ≠
Resource Ownership
    ≠
Database Integrity
    ≠
Concurrency Control
    ≠
Operational Security
```

Passing one layer does not imply passing the others.

For example:

```text
Valid Request
      ↓
Authenticated User
      ↓
Correct Permission
      ↓
Correct Resource Ownership
      ↓
Valid Business State
      ↓
Atomic Database Operation
```

A secure backend needs all of those boundaries to remain correct.

---

# 27. Current Security Assessment

The security foundation is substantially stronger than a conventional beginner CRUD API.

The strongest implemented areas are:

- Password handling
- Server-side sessions
- RBAC
- Request validation
- Parameterized database values
- Database constraints
- Transactional inventory operations
- Row-level locking
- Security unit testing

The largest remaining risks are not elementary authentication mistakes. They are **authorization granularity, business-state integrity, concurrency verification, and production operational controls**.

Accordingly, the current security posture should be classified as:

```text
Strong foundation
        +
Incomplete production hardening
```

The project should not be described as fully production-secure until the remaining authorization, integrity, integration-testing, and operational controls have been implemented and verified.
