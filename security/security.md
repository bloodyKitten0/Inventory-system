**# Assets**

**## Asset: Authentication System**

\***\*Why it matters:\*\***

Users need authentication to access protected parts of the system.

If authentication becomes unavailable, legitimate users may be unable to log in.

\***\*Primary security concern:\*\***

Availability

---

**## Asset: Inventory API**

\***\*Why it matters:\*\***

The application depends on the API to perform inventory operations.

If it becomes unavailable, users cannot use the system.

\***\*Primary security concern:\*\***

Availability

\***\*Who should have access:\*\***

Authorized clients/users

---

**## Asset: Inventory Database**

\***\*Why it matters:\*\***

The API depends on the database to retrieve and modify inventory, products, orders, customers, and other application data.

\***\*Primary security concern:\*\***

Availability

\***\*Who should have access:\*\***

Application / authorized administrators

---

**## Asset: Customer Information**

\***\*Why it matters:\*\***

Contains private customer information, including email addresses and shipping addresses.

\***\*Primary security concern:\*\***

Confidentiality

\***\*Who should have access:\*\***

Admins / authorized personnel / the customer associated with their own information

---

**## Asset: Inventory**

\***\*Why it matters:\*\***

Contains inventory information that must not be modified by unauthorized users.

\***\*Primary security concern:\*\***

Integrity

\***\*Who should have access:\*\***

Inventory Manager / Owner / other specifically authorized personnel

---

**## Asset: Products Suppliers**

\***\*Why it matters:\*\***

Contains relationships between products and suppliers that should only be accessible to authorized personnel.

\***\*Primary security concern:\*\***

Confidentiality / Integrity

\***\*Who should have access:\*\***

Product Manager / Owner / other specifically authorized personnel

---

**## Asset: Orders**

\***\*Why it matters:\*\***

Customers should only be able to access their own orders.

\***\*Primary security concern:\*\***

Confidentiality / Integrity

\***\*Who should have access:\*\***

Customers for their own orders / Ordering Manager / Owner / other specifically authorized personnel

---

**## Asset: Categories**

\***\*Why it matters:\*\***

Unauthorized users should not be able to create or modify product categories.

\***\*Primary security concern:\*\***

Integrity

\***\*Who should have access:\*\***

Category Manager / Owner / other specifically authorized personnel

---

**## Asset: Order Items**

\***\*Why it matters:\*\***

Customers should only be able to access the items belonging to their own orders.

\***\*Primary security concern:\*\***

Confidentiality / Integrity

\***\*Who should have access:\*\***

Customers for their own order items / Ordering Manager / Owner / other specifically authorized personnel

---

**## Asset: Products**

\***\*Why it matters:\*\***

Product information and pricing must not be modified without authorization.

\***\*Primary security concern:\*\***

Integrity

\***\*Who should have access:\*\***

Customers for read-only catalog access / Product Manager / Owner / other specifically authorized personnel

---

**## Asset: Stock Movements**

\***\*Why it matters:\*\***

Stock movement history represents changes to inventory and should only be visible to authorized personnel.

\***\*Primary security concern:\*\***

Confidentiality / Integrity

\***\*Who should have access:\*\***

Inventory Manager / Owner / other specifically authorized personnel

---

**## Asset: Suppliers**

\***\*Why it matters:\*\***

Supplier information should not be accessible or modified without authorization.

\***\*Primary security concern:\*\***

Confidentiality / Integrity

\***\*Who should have access:\*\***

Supplier Manager / Owner / other specifically authorized personnel

---

**## Asset: Warehouses**

\***\*Why it matters:\*\***

Warehouse information should not be accessed or modified without authorization.

\***\*Primary security concern:\*\***

Confidentiality / Integrity

\***\*Who should have access:\*\***

Warehouse Manager / Owner / other specifically authorized personnel

---

# Attack Surface

**## HTTP API**

All exposed REST endpoints accept requests from external clients.

**## HTTP Methods**

The API exposes GET, POST, PUT, PATCH and DELETE operations.

**## Route Parameters**

Endpoints such as `/products/:id` accept client-controlled identifiers.

**## Request Bodies**

JSON request bodies are accepted through `express.json()` and are passed into the application's request-processing logic.

**## Query Parameters**

Where used, query parameters are controlled by the client.

**## API Documentation**

The Swagger UI is exposed through `/api-docs`.

**## Database Access**

Controllers and services process API input and use it to interact with the PostgreSQL database.

**## Authentication**

Authentication endpoints accept credentials and verification tokens from clients.

**## Session Management**

Authenticated requests use a session ID stored in an HTTP-only cookie. The corresponding session data is stored server-side in Redis.

**## Authorization**

Protected routes evaluate the authenticated account's roles and permissions before allowing the requested operation.

---

# Trust Boundaries

**## Client → API**

The client may provide untrusted input that can affect the application.

All client-controlled input must therefore be validated before being used by application logic or database operations.

**## API → Database**

The API processes client-controlled input before using it to interact with the PostgreSQL database.

Parameterized SQL queries and input validation are used to reduce the risk of malicious or invalid input affecting database state.

**## API → Redis**

The API communicates with Redis for server-side session storage.

Session identifiers are generated by the server and session data is stored server-side rather than trusting client-provided session contents.

---

# Threats

**## Read**

An attacker may attempt to access information they are not authorized to see.

Examples:

- Customer information
- Supplier information
- Orders belonging to other customers
- Order items belonging to other customers
- Stock movement information
- Warehouse information
- Accessing another customer's resources by changing an identifier supplied in the request

\***\*Primary security concern:\*\***

Confidentiality

---

**## Create**

An attacker may attempt to create data that should not exist or that they are not authorized to create.

Examples:

- Fake products
- Products that are not actually for sale
- Fake suppliers
- Unauthorized categories
- Unauthorized orders
- Unauthorized inventory records
- Unauthorized role assignments

\***\*Primary security concern:\*\***

Integrity

---

**## Modify**

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

\***\*Primary security concern:\*\***

Integrity

---

**## Delete**

An attacker may attempt to delete data without permission.

Examples:

- Products
- Suppliers
- Categories
- Orders
- Warehouse information
- Roles

Stock movement deletion is not exposed as a normal public operation because stock movements represent historical inventory activity.

\***\*Primary security concerns:\*\***

Integrity / Availability

---

**## Authentication**

An attacker may attempt to gain access to an account using stolen, guessed, or invalid credentials.

Examples:

- Repeated login attempts
- Using an unverified account
- Using an invalid session
- Using a stolen session identifier

\***\*Primary security concerns:\*\***

Confidentiality / Integrity

---

**## Session**

An attacker may attempt to use or manipulate session information to access an authenticated account.

Examples:

- Obtaining a valid session ID
- Using an expired session
- Reusing a deleted session

\***\*Primary security concern:\*\***

Confidentiality

---

**## Authorization / Privilege Escalation**

An attacker may attempt to perform actions outside the permissions granted to their account.

Examples:

- Customer attempting to assign themselves the Owner role
- Customer attempting to grant permissions to a role
- Manager attempting to access role-management endpoints
- User modifying another account's roles
- User accessing another customer's orders by changing an identifier
- User accessing another customer's order items

\***\*Primary security concerns:\*\***

Confidentiality / Integrity

---

# Current Security Controls

**## Input Validation**

The API performs input validation on fields before processing requests.

Examples include:

- Preventing negative prices
- Validating IDs
- Validating quantities
- Validating email addresses
- Validating required strings
- Validating shipping addresses

This helps prevent invalid or nonsensical data from entering the system.

\***\*Limitations:\*\***

Input validation does not determine whether a user is authorized to perform an operation or whether the requested resource belongs to that user.

---

**## Parameterized SQL**

Database values supplied by requests are passed through parameterized SQL queries using parameters such as `$1`, `$2`, and `$3`.

This reduces the risk of SQL injection through normal request values.

\***\*Limitations:\*\***

Parameterized values do not automatically provide authorization or prevent every other form of application-level attack.

---

**## Error Handling**

The API contains error-handling mechanisms for handling request and application errors.

This helps prevent expected errors from causing uncontrolled application failures.

\***\*Limitations:\*\***

Error handling does not prevent unauthorized access or unauthorized modification of data.

---

**## Password Hashing**

Passwords are not stored as plaintext.

The application uses Argon2 to derive password hashes before storing passwords in the database.

This makes offline password cracking substantially more expensive if the password database is exposed.

\***\*Limitations:\*\***

Password hashing does not prevent account compromise through other methods, such as stolen credentials. No password-hashing system provides absolute protection against password attacks.

---

**## Account Verification**

New accounts must be verified using a verification token before they can log in.

Verification tokens are generated randomly and only their hashes are stored in the database.

\***\*Limitations:\*\***

Account verification does not determine what an authenticated user is allowed to access or modify.

---

**## Server-Side Sessions**

Authenticated users receive a cryptographically random session ID.

The session data is stored server-side in Redis, while the session ID is stored in an HTTP-only cookie.

Sessions also have an expiration time through Redis TTL.

\***\*Limitations:\*\***

Authentication through sessions establishes the user's identity but does not by itself determine whether that user has permission to perform a particular operation.

---

**## HTTP-Only Session Cookie**

The session cookie uses `httpOnly: true`, preventing normal client-side JavaScript from directly accessing the cookie.

The cookie also uses `sameSite: "lax"`.

The `secure` setting is environment-dependent so local HTTP development can use an insecure connection while HTTPS deployment can require secure cookies.

\***\*Limitations:\*\***

Cookie protections do not replace authorization and do not protect against every possible session-related attack.

---

**## Authentication Middleware**

Protected API routes use authentication middleware.

The middleware:

1. Reads the session ID from the cookie.
2. Retrieves the session from Redis.
3. Rejects missing or invalid sessions.
4. Places the authenticated user's session information into `req.user`.

This establishes the identity of the requester for protected routes.

\***\*Limitations:\*\***

Authentication establishes identity but does not determine the actions or resources available to the account.

---

**## Authorization / RBAC**

The application now implements role-based access control.

The system contains:

- Roles
- Permissions
- Role-to-permission assignments
- Account-to-role assignments
- Permission-checking service
- Authorization middleware
- Owner role
- Owner-only role and access-management endpoints

The current roles are:

- Owner
- Product Manager
- Category Manager
- Customer Manager
- Supplier Manager
- Warehouse Manager
- Inventory Manager
- Ordering Manager
- Customer

Routes use operation-specific permissions such as `product.read`, `inventory.adjust`, `order.process`, and `role.permission.grant`.

The Owner role has the complete current permission set and is responsible for role and role-assignment administration.

New accounts are automatically assigned the Customer role during registration. Registration does not accept a client-selected privileged role.

The Owner role and role-assignment system include protections against deleting the Owner role and removing the final Owner assignment.

\***\*Limitations:\*\***

RBAC determines whether an account has a capability, but it does not by itself determine whether a specific resource belongs to that account.

For example, `order.read` does not by itself guarantee that a customer can only read their own order.

That requires resource-level Access Control.

---

**## Transactions**

The application uses PostgreSQL transactions for operations where multiple database changes must succeed or fail together.

Inventory adjustment and order processing use transactions and row locking to help maintain consistent inventory state during concurrent operations.

\***\*Limitations:\*\***

Transactions protect database consistency but do not determine whether the requester is authorized to perform the operation.

---

# Missing Security Controls

**## Resource-Level Access Control**

\***\*Status: NOT IMPLEMENTED\*\***

RBAC is implemented, but the application does not yet fully enforce whether an authenticated user may access a **specific resource instance**.

Examples:

- A customer reading another customer's order
- A customer reading another customer's order items
- A customer modifying an order belonging to another customer
- A customer modifying an order item belonging to another customer
- A customer accessing another customer's information by changing an identifier

This is the next authorization layer after RBAC.

\***\*Primary threats addressed:\*\***

- Broken access control
- Horizontal privilege escalation
- Unauthorized access to another customer's resources
- Unauthorized modification of another customer's resources
- Insecure direct object reference style attacks

---

**## Rate Limiting**

\***\*Status: NOT IMPLEMENTED\*\***

The API currently does not limit how frequently a client can send requests.

An attacker could automate a large number of requests, such as repeatedly attempting different passwords against a login endpoint.

\***\*Primary threats addressed:\*\***

- Brute-force attacks
- Automated abuse
- Excessive requests
- Denial-of-service through request flooding

---

**## CORS**

\***\*Status: NOT IMPLEMENTED\*\***

Cross-origin access controls have not yet been configured for the API.

\***\*Primary threats addressed:\*\***

- Unauthorized cross-origin API access
- Unintended browser-based access from untrusted origins

---

**## CSRF Protection**

\***\*Status: NOT IMPLEMENTED\*\***

Because authenticated requests use cookies, CSRF protection must be considered before exposing the application to untrusted cross-site requests.

\***\*Primary threats addressed:\*\***

- Cross-site request forgery
- Unauthorized state-changing requests made using a victim's session

---

**## JWT**

\***\*Status: NOT IMPLEMENTED\*\***

JWT-based authentication has not been implemented.

This is not currently a requirement for the existing session-based authentication architecture and should only be added when there is a concrete architectural reason to use token-based authentication.

---

**## OAuth 2.0**

\***\*Status: NOT IMPLEMENTED\*\***

Third-party delegated authentication and authorization have not been implemented.

This is a later security capability rather than a prerequisite for the current session-based system.

---

**## Secrets Management**

\***\*Status: PARTIALLY IMPLEMENTED\*\***

Environment variables are used for configuration values such as role IDs and cookie configuration.

A complete secrets-management strategy, including secure production storage, rotation, and operational handling of credentials and API secrets, has not yet been implemented.

---

**## Security Testing**

\***\*Status: IN PROGRESS\*\***

Manual RBAC testing has been performed, including unauthorized role and permission operations.

Automated security testing has not yet been fully implemented.

Future tests should cover:

- Authentication failures
- Authorization failures
- Privilege escalation
- Resource ownership
- Session invalidation
- Rate-limit behavior
- Input abuse
- Security regression testing

---

**## Secure API Design**

\***\*Status: NOT IMPLEMENTED\*\***

The API has several important security controls but still needs a broader secure-design review covering:

- Consistent authorization
- Resource ownership
- Error exposure
- HTTP security headers
- Request limits
- API abuse controls
- Security logging and monitoring
- Safer state-changing operations

---

# Security Priorities

**## Ranking System**

🔴 Critical

🟠 Very High

🟣 High

🟡 Medium

🔵 Low

🟢 Minimal

---

**## 1. Authentication 🔴 Critical**

\***\*Status: IMPLEMENTED\*\***

\***\*Reason:\*\***

Authentication establishes the identity of the requester so the system can determine which account is making a request.

Current controls include:

- Email/password login
- Password hashing with Argon2
- Account verification
- Verification tokens
- Redis-backed sessions
- Cryptographically random session IDs
- HTTP-only session cookies
- Session expiration
- Logout/session deletion
- Authentication middleware

---

**## 2. Authorization / RBAC 🔴 Critical**

\***\*Status: IMPLEMENTED\*\***

\***\*Reason:\*\***

The application now determines whether an authenticated account has permission to perform a particular operation.

Current controls include:

- Role-based access control
- Operation-specific permissions
- Role-to-permission mappings
- Account-to-role mappings
- Authorization middleware
- Owner role
- Owner-only role administration
- Protected API routers
- Privilege-escalation testing
- Secure default Customer role during registration

---

**## 3. Resource-Level Access Control 🔴 Critical**

\***\*Status: NEXT\*\***

\***\*Reason:\*\***

RBAC answers whether the account has a capability. Resource-level Access Control answers whether the account is allowed to act on **this particular resource**.

This is required to guarantee things such as:

- Customer A can only access Customer A's orders
- Customer A cannot modify Customer B's order
- Customer A cannot access Customer B's order items
- Client-controlled IDs cannot be used to bypass ownership restrictions

This is the next security phase.

---

**## 4. Rate Limiting 🟣 High**

\***\*Status: NOT IMPLEMENTED\*\***

\***\*Reason:\*\***

Rate limiting helps prevent attackers from making large numbers of automated requests, especially repeated authentication attempts.

It should follow the completion of Access Control.

---

**## 5. CORS 🟡 Medium**

\***\*Status: NOT IMPLEMENTED\*\***

\***\*Reason:\*\***

CORS should explicitly define which browser origins are permitted to make cross-origin requests to the API.

---

**## 6. CSRF 🟡 Medium**

\***\*Status: NOT IMPLEMENTED\*\***

\***\*Reason:\*\***

The current cookie-based authentication architecture requires protection against unauthorized cross-site state-changing requests.

---

**## 7. Secrets Management 🟡 Medium**

\***\*Status: PARTIALLY IMPLEMENTED\*\***

\***\*Reason:\*\***

Configuration is already externalized through environment variables, but production secret storage, rotation, and operational management still need to be addressed.

---

**## 8. Security Testing 🟣 High**

\***\*Status: PARTIALLY IMPLEMENTED\*\***

\***\*Reason:\*\***

Security controls should eventually be tested automatically to prevent regressions.

---

**## 9. JWT / OAuth 2.0 🔵 Low**

\***\*Status: NOT IMPLEMENTED\*\***

\***\*Reason:\*\***

The application already uses server-side sessions. JWT and OAuth 2.0 are future capabilities that should be introduced only when their architectural use cases are established.

---

**## 10. Secure API Design 🟣 High**

\***\*Status: IN PROGRESS\*\***

\***\*Reason:\*\***

The existing security controls provide a strong foundation, but the entire API still needs a final security-focused design review after the major controls are implemented.

---

# Current Security State

The application currently has:

- Input validation
- Parameterized SQL queries
- Centralized error handling
- Password hashing with Argon2
- Account verification
- Hashed verification tokens
- Redis-backed server-side sessions
- Cryptographically random session IDs
- HTTP-only session cookies
- Session expiration
- Authentication middleware
- Database transactions
- Row locking for important inventory operations
- Role-based access control
- Operation-specific permissions
- Role-to-permission mappings
- Account-to-role mappings
- Owner role and owner administration
- Protected application routers
- Secure default Customer role during registration
- Manual privilege-escalation testing

The remaining major security controls are:

- Resource-level Access Control
- Rate Limiting
- CORS
- CSRF
- Secrets Management
- Automated Security Testing
- Secure API Design review
- JWT / OAuth 2.0 as later architectural options

The current security progression is:

**Authentication → Authorization → RBAC → Resource-Level Access Control → Rate Limiting → CORS → CSRF → Secrets Management → Security Testing → Secure API Design**

JWT and OAuth 2.0 remain optional later-stage authentication architectures rather than mandatory next steps.
