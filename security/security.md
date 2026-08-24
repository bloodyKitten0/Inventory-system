# Assets

## Asset: Authentication system

**Why it matters:**
Users need authentication to access protected parts of the system.
If authentication becomes unavailable, legitimate users may be unable to log in.

**Primary security concern:**
Availability

## Asset: Inventory API

**Why it matters:**
The application depends on the API to perform inventory operations.
If it becomes unavailable, users cannot use the system.

**Primary security concern:**
Availability

**Who should have access:**
Authorized clients/users

## Asset: Inventory database

**Why it matters:**
The API depends on the database to retrieve and modify inventory,
products, orders, customers, etc.

**Primary security concern:**
Availability

**Who should have access:**
Application / authorized administrators

## Asset: Customer information

**Why it matters:**
Contains private customer information, including email addresses.

**Primary security concern:**
Confidentiality

**Who should have access:**
Admins / authorized personnel

## Asset: Inventory

**Why iy matters:**
Contains senstive info that must not be edited by anyone without trust

**Primary security concern:**
Integrity

**Who should have access:**
Admins / authorized personnel

## Asset: Products suppliers

**Why iy matters:**
No one must know it except people that's related to it

**Primary security concern:**
Confidentiality

**Who should have access:**
High tier admins / authorized personnel

## Asset: Orders

**Why iy matters:**
The customer should only access his orders

**Primary security concern:**
Confidentiality

**Who should have access:**
Admins / authorized personnel

## Asset: Categories

**Why iy matters:**
No one should have the ability to create it without permision

**Primary security concern:**
Integrity

**Who should have access:**
Hight tier admins / authorized personnel

## Asset: Orders items

**Why iy matters:**
The customer should only access his order's items not others

**Primary security concern:**
Confidentiality

**Who should have access:**
admins / authorized personnel

## Asset: Products

**Why iy matters:**
No one should edit it without having permision

**Primary security concern:**
Integrity

**Who should have access:**
High tier admins / authorized personnel

## Asset: Stock movement

**Why iy matters:**
Only movement admins should be able to see it

**Primary security concern:**
Confidentiality

**Who should have access:**
Movement admins / authorized personnel

## Asset: Suppleirs

**Why iy matters:**
No one must know them if not with permision

**Primary security concern:**
Confidentiality/Integrity

**Who should have access:**
High tier admins / authorized personnel

## Asset: Warehouses

**Why iy matters:**
no one must edit or know them without permision

**Primary security concern:**
Confidentiality/Integrity

**Who should have access:**
admins / authorized personnel

# Attack Surface

## HTTP API

All exposed REST endpoints accept requests from external clients.

## HTTP Methods

The API exposes GET, POST, PATCH and DELETE operations.

## Route Parameters

Endpoints such as /products/:id accept client-controlled identifiers.

## Request Bodies

JSON request bodies are accepted through express.json() and are
passed into the application's request-processing logic.

## Query Parameters

Where used, query parameters are controlled by the client.

## API Documentation

The Swagger UI is exposed through /api-docs.

## Database Access

Controllers/services process API input and use it to interact
with the PostgreSQL database.

# Trust Boundaries

## Client → API

The client may add untrusted info that may affect the system

## API → Database

The API processes client-controlled input before using it to interact with the database.
Input must be properly checked before it can affect database state.

# Threats

## Read

An attacker may attempt to access information they are not authorized
to see.

Examples:

- Customer information
- Supplier information
- Orders belonging to other customers
- Order items belonging to other customers
- Stock movement information
- Warehouse information
- Accessing another customer's resources by changing an identifier supplied in the request.

**Primary security concern:**
Confidentiality

## Create

An attacker may attempt to create data that should not exist or that
they are not authorized to create.

Examples:

- Fake products
- Products that are not actually for sale
- Fake suppliers
- Unauthorized categories
- Unauthorized orders

**Primary security concern:**
Integrity

## Modify

An attacker may attempt to modify existing data without permission.

Examples:

- Changing product prices
- Changing product information
- Modifying supplier information
- Modifying inventory
- Modifying orders
- Modifying warehouse information

**Primary security concern:**
Integrity

## Delete

An attacker may attempt to delete data without permission.

Examples:

- Products
- Suppliers
- Categories
- Stock movements
- Orders
- Warehouse information

**Primary security concerns:**
Integrity / Availability

# Current Security Controls

## Input Validation

The API performs input validation on certain fields before
processing requests.

Examples include preventing negative prices and quantities.

This helps prevent invalid or nonsensical data from entering
the system.

**Limitations**
Input validation does not determine whether a user is
authorized to perform an operation or whether the requested
change is allowed.

## Error Handling

The API contains error-handling mechanisms for handling
request and application errors.

This helps prevent expected errors from causing uncontrolled
application failures.

**Limitations**
Error handling does not prevent unauthorized access or
unauthorized modification of data.

## Password hashing

To not save the passwords in the database as plain text anyone can use

helps to slow entering accounts if the database was exposed

**Limitations**
There's nothing called absolute safety so we can't say no one would ever surpass it

# Missing Security Controls

## Authentication

The API currently does not establish the identity of the
requester.

Without authentication, the system cannot reliably determine
who is making a request.

Primary threats addressed:

- Unauthorized access
- Unauthorized actions
- Identity-based access control failures

## Authorization

The API currently does not enforce whether an authenticated
user is permitted to perform a particular operation on a
particular resource.

This includes authorization for CRUD operations.

Primary threats addressed:

- Unauthorized reads
- Unauthorized creation
- Unauthorized modification
- Unauthorized deletion
- Privilege escalation
- Unauthorized access to another customer's resources

## Rate Limiting

The API currently does not limit how frequently a client can
send requests.

An attacker could automate a large number of requests, such
as repeatedly attempting different passwords against a login
endpoint.

**Primary threats addressed:**

- Brute-force attacks
- Automated abuse
- Excessive requests

# Security Priorities

## Ranking system

🔴 Critical
🟠 Very High
🟣 High
🟡 Medium
🔵 Low
🟢 Minimal

## 1. Authentication 🔴 Critical

**Reason**
To establish the identity of the requester so the system knows who is making the request.

## 2. Authorization 🔴 Critical

**Reason**
To determine what an authenticated user is allowed to access or modify.

## 4. Rate Limiting 🟣 High

**Reason**
To prevent attackers from making large numbers of automated requests ,especially repeated login attempts.
