# Assets

## Asset: Authentication System

**_Why it matters:_**

Users need authentication to access protected parts of the system.

If authentication becomes unavailable, legitimate users may be unable to log in.

**_Primary security concerns:_**

Confidentiality / Integrity / Availability

**_Who should have access:_**

Authenticated users through the application's authentication system.

---

## Asset: Inventory API

**_Why it matters:_**

The application depends on the API to perform inventory operations.

If it becomes unavailable, users cannot use the system.

**_Primary security concerns:_**

Availability / Integrity

**_Who should have access:_**

Authenticated and authorized clients/users.

---

## Asset: Inventory Database

**_Why it matters:_**

The API depends on the database to retrieve and modify inventory, products, orders, customers, and other application data.

**_Primary security concerns:_**

Confidentiality / Integrity / Availability

**_Who should have access:_**

Application services and authorized administrators.

---

## Asset: Customer Information

**_Why it matters:_**

Contains private customer information, including account and customer-related information.

**_Primary security concern:_**

Confidentiality

**_Who should have access:_**

Authorized personnel and the customer where resource-level authorization permits access.

---

## Asset: Inventory

**_Why it matters:_**

Contains inventory information that must not be modified by unauthorized users.

**_Primary security concern:_**

Integrity

**_Who should have access:_**

Inventory Manager / Owner / other specifically authorized personnel.

---

## Asset: Products Suppliers

**_Why it matters:_**

Contains relationships between products and suppliers that should only be modified or accessed by authorized personnel.

**_Primary security concerns:_**

Confidentiality / Integrity

**_Who should have access:_**

Product Manager / Supplier Manager / Owner / other specifically authorized personnel.

---

## Asset: Orders

**_Why it matters:_**

Orders contain customer and operational information and must not be modified by unauthorized users.

Customers should eventually only be able to access orders belonging to them.

**_Primary security concerns:_**

Confidentiality / Integrity

**_Who should have access:_**

Customers according to resource ownership / Ordering Manager / Owner / other specifically authorized personnel.

**_Current limitation:_**

RBAC permissions are implemented, but resource-level ownership checks are not yet fully implemented.

---

## Asset: Categories

**_Why it matters:_**

Unauthorized users should not be able to create or modify product categories.

**_Primary security concern:_**

Integrity

**_Who should have access:_**

Category Manager / Owner / other specifically authorized personnel.

---

## Asset: Order Items

**_Why it matters:_**

Order items contain information associated with orders and should only be accessed or modified by authorized users.

Customers should eventually only be able to access order items belonging to their own orders.

**_Primary security concerns:_**

Confidentiality / Integrity

**_Who should have access:_**

Customers according to resource ownership / Ordering Manager / Owner / other specifically authorized personnel.

**_Current limitation:_**

Resource-level ownership checks are not yet fully implemented.

---

## Asset: Products

**_Why it matters:_**

Product information and pricing must not be modified without authorization.

**_Primary security concern:_**

Integrity

**_Who should have access:_**

Customers for permitted read access / Product Manager / Owner / other specifically authorized personnel.

---

## Asset: Stock Movements

**_Why it matters:_**

Stock movement history represents changes to inventory and should only be visible or modified through authorized inventory operations.

**_Primary security concerns:_**

Confidentiality / Integrity

**_Who should have access:_**

Inventory Manager / Owner / other specifically authorized personnel.

---

## Asset: Suppliers

**_Why it matters:_**

Supplier information should not be accessed or modified without authorization.

**_Primary security concerns:_**

Confidentiality / Integrity

**_Who should have access:_**

Supplier Manager / Owner / other specifically authorized personnel.

---

## Asset: Warehouses

**_Why it matters:_**

Warehouse information should not be accessed or modified without authorization.

**_Primary security concerns:_**

Confidentiality / Integrity

**_Who should have access:_**

Warehouse Manager / Owner / other specifically authorized personnel.

---

# Attack Surface

## HTTP API

All exposed REST endpoints accept requests from clients.

Protected routes require authentication and, where configured, the appropriate permission.

## HTTP Methods

The API exposes GET, POST, PUT, PATCH and DELETE operations.

State-changing methods require appropriate authorization.

## Route Parameters

Endpoints accept client-controlled identifiers such as product, inventory, order, and other resource IDs.

These values must be validated and authorized before the requested resource is accessed or modified.

## Request Bodies

JSON request bodies are accepted through `express.json()` and are passed into the application's request-processing logic.

Request validation is used on routes where validation schemas are defined.

## Query Parameters

Where used, query parameters are controlled by the client and must be treated as untrusted input.

Validation is applied to query parameters where required by the route.

## API Documentation

The Swagger UI is exposed through `/api-docs`.

API documentation itself does not provide authorization and should therefore not be treated as a security boundary.

## Database Access

Controllers and services process API input and use it to interact with the PostgreSQL database.

User-controlled SQL values are passed through parameterized queries.

Some generic database services construct SQL identifiers from application-controlled values; these identifiers must remain trusted application-defined values rather than arbitrary client input.

## Authentication

Authentication endpoints accept credentials and verification-related input from clients.

Passwords are processed using Argon2 rather than stored as plaintext.

## Session Management

Authenticated requests use a session ID stored in an HTTP-only cookie.

The corresponding session data is stored server-side in Redis.

Sessions have a server-side expiration through Redis TTL.

## Authorization

Protected routes evaluate the authenticated account's permissions before allowing the requested operation.

The application implements role-based access control using accounts, roles, permissions, account-role relationships, and role-permission relationships.

---

# Trust Boundaries

## Client → API

The client may provide untrusted input that can affect the application.

All client-controlled input must therefore be treated as untrusted and validated before being used by application logic or database operations.

Authentication and authorization must also be enforced independently of input validation.

## API → Database

The API processes client-controlled input before using it to interact with the PostgreSQL database.

Parameterized SQL queries are used for request-controlled values.

Transactions and row locking are used for important multi-step inventory/order operations where database consistency and concurrency control are required.

## API → Redis

The API communicates with Redis for server-side session storage.

Session identifiers are generated by the server and session data is stored server-side rather than trusting client-provided session contents.

---

# Threats

## Read

An attacker may attempt to access information they are not authorized to see.

Examples:

- Customer information
- Supplier information
- Orders
- Order items
- Stock movement information
- Warehouse information
- Other protected resources
- Accessing another resource by changing an identifier supplied in the request

**_Primary security concern:_**

Confidentiality

**_Current protection:_**

Authentication and RBAC permission checks are implemented.

**_Remaining limitation:_**

Resource-level authorization is not yet fully implemented, so possession of a broad read permission does not automatically prove ownership of a specific resource.

---

## Create

An attacker may attempt to create data that they are not authorized to create.

Examples:

- Products
- Suppliers
- Categories
- Orders
- Inventory records
- Unauthorized role assignments

**_Primary security concern:_**

Integrity

**_Current protection:_**

Protected routes use authentication and operation-specific permissions.

Registration does not allow a client to select an arbitrary privileged role.

---

## Modify

An attacker may attempt to modify existing data without permission.

Examples:

- Changing product prices
- Changing product information
- Modifying supplier information
- Modifying inventory
- Modifying orders
- Modifying warehouse information
- Changing data belonging to another customer
- Modifying roles or permissions without authorization

**_Primary security concern:_**

Integrity

**_Current protection:_**

Authentication and operation-specific RBAC permissions are implemented.

Inventory and order operations that require multiple database changes use transactions and row locking.

**_Remaining limitation:_**

Resource-level authorization is not yet fully implemented.

---

## Delete

An attacker may attempt to delete data without permission.

Examples:

- Products
- Suppliers
- Categories
- Orders
- Warehouse information
- Other application records

Stock movement history is not exposed as a normal public deletion operation.

**_Primary security concerns:_**

Integrity / Availability

**_Current protection:_**

Deletion routes require authentication and the appropriate delete permission.

---

## Authentication

An attacker may attempt to gain access to an account using stolen, guessed, or invalid credentials.

Examples:

- Repeated login attempts
- Using an unverified account
- Using an invalid session
- Using an expired session
- Using a stolen session identifier

**_Primary security concerns:_**

Confidentiality / Integrity

**_Current protection:_**

- Argon2 password hashing
- Account verification
- Server-side Redis sessions
- Cryptographically random session identifiers
- HTTP-only session cookies
- Session expiration
- Authentication middleware

**_Remaining limitation:_**

Rate limiting is not currently implemented.

---

## Session

An attacker may attempt to use or manipulate session information to access an authenticated account.

Examples:

- Obtaining a valid session ID
- Using an expired session
- Reusing a deleted session
- Attempting to use an invalid session ID

**_Primary security concern:_**

Confidentiality

**_Current protection:_**

Sessions are stored server-side in Redis.

The client receives a session identifier rather than the complete session state.

The session cookie uses HTTP-only protection and `SameSite=Lax`.

**_Remaining limitation:_**

A dedicated CSRF protection mechanism is not currently implemented.

---

## Authorization / Privilege Escalation

An attacker may attempt to perform actions outside the permissions granted to their account.

Examples:

- Customer attempting to assign themselves the Owner role
- Customer attempting to grant permissions
- Manager attempting to access role-management operations
- User modifying another account's roles
- User attempting to perform an operation without the required permission
- User accessing another customer's resources by changing an identifier

**_Primary security concerns:_**

Confidentiality / Integrity

**_Current protection:_**

- RBAC
- Operation-specific permissions
- Authorization middleware
- Account-role relationships
- Role-permission relationships
- Owner role
- Protected role/permission administration
- Default Customer role during registration

**_Remaining limitation:_**

RBAC does not by itself enforce ownership of individual resources.

Resource-level access control is therefore the next authorization layer.

---

# Current Security Controls

## Input Validation

The API performs schema-based input validation before processing validated requests.

The validation middleware supports controls including:

- Required values
- Data types
- Trimming
- Minimum length
- Maximum length
- Regular expressions
- Integer validation
- Minimum values
- Maximum values
- Finite-number validation
- Email validation
- Enumerations
- Custom validation
- Inequality constraints

Examples include:

- Validating IDs
- Validating quantities
- Validating prices
- Validating email addresses
- Validating required strings

This helps prevent invalid or nonsensical data from entering application logic.

**_Limitations:_**

Input validation does not determine whether a user is authorized to perform an operation or whether the requested resource belongs to that user.

---

## Parameterized SQL

Database values supplied by requests are passed through parameterized SQL queries using parameters such as `$1`, `$2`, and `$3`.

This reduces the risk of SQL injection through normal request values.

**_Limitations:_**

Parameterized values do not automatically provide authorization or prevent other application-level attacks.

SQL identifiers used by generic services must also remain controlled by application code rather than client input.

---

## Error Handling

The API contains error-handling mechanisms for handling validation, database, and application errors.

This helps prevent expected errors from causing uncontrolled application failures.

**_Limitations:_**

Error handling does not prevent unauthorized access or unauthorized modification of data.

---

## Password Hashing

Passwords are not stored as plaintext.

The application uses Argon2 to derive password hashes before storing passwords in the database.

This makes offline password cracking substantially more expensive if the password database is exposed.

**_Limitations:_**

Password hashing does not prevent account compromise through stolen credentials, session theft, or other authentication attacks.

---

## Account Verification

New accounts use an account-verification process before normal authentication is permitted.

Verification tokens are handled as security-sensitive values and are not intended to be treated as ordinary user data.

**_Limitations:_**

Account verification establishes that the verification process was completed; it does not determine what an authenticated user is authorized to access or modify.

---

## Server-Side Sessions

Authenticated users receive a cryptographically random session ID.

The session data is stored server-side in Redis, while the session ID is stored in an HTTP-only cookie.

Sessions have an expiration time through Redis TTL.

**_Limitations:_**

Authentication through sessions establishes the user's identity but does not by itself determine whether that user has permission to perform a particular operation.

---

## HTTP-Only Session Cookie

The session cookie uses `httpOnly: true`, preventing normal client-side JavaScript from directly accessing the cookie.

The cookie also uses `sameSite: "lax"`.

The `secure` setting is environment-dependent.

**_Limitations:_**

Cookie protections do not replace authorization and do not provide a complete CSRF defense.

---

## Authentication Middleware

Protected API routes use authentication middleware.

The middleware:

1. Reads the session ID from the cookie.
2. Retrieves the session from Redis.
3. Rejects missing or invalid sessions.
4. Associates the authenticated session information with the request.

This establishes the identity of the requester for protected routes.

**_Limitations:_**

Authentication establishes identity but does not determine the actions or resources available to the account.

---

## Authorization / RBAC

The application implements role-based access control.

The system contains:

- Roles
- Permissions
- Role-to-permission assignments
- Account-to-role assignments
- Permission-checking service
- Authorization middleware

The current role structure includes:

- Owner
- Product Ma
