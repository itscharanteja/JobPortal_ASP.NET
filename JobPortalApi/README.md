# Job Portal API Test Documentation

## Test Structure Overview

The test suite is organized into several key areas, each focusing on specific functionalities of the Job Portal API. All tests are implemented as integration tests using `WebApplicationFactory` for full-stack testing from HTTP requests through to the database layer.

## Test Categories

### 1. Authentication Tests (`AuthenticationTests.cs`)

- User Registration
  - Valid registration scenarios
  - Invalid registration handling
  - Different user type registrations (Admin/JobSeeker/Recruiter)
- Login Functionality
  - Credential validation
  - Token generation
  - Authentication verification
- Security Validation
  - Invalid credential handling
  - Token validation

### 2. Admin Tests (`AdminTests.cs`)

- Administrative Operations
  - User account management
  - Administrative privileges verification
  - Admin-specific endpoint testing
- Role-based Authorization
  - Admin role verification
  - Access control testing
- User Management
  - User account operations
  - Permission management

### 3. Jobs Tests (`JobsTests.cs`)

- Job Posting Management
  - Create new job listings
  - Update existing jobs
  - Delete job postings
  - Job listing retrieval
- Recruiter Operations
  - Recruiter-specific permissions
  - Job posting authorization
- Search and Filter
  - Job search functionality
  - Filter operations
  - Listing management

### 4. JobSeeker Tests (`JobSeekerTests.cs`)

- Profile Management
  - Profile creation
  - Profile updates
  - Information validation
- Application Process
  - Job application submission
  - Resume upload functionality
  - Application status tracking
- JobSeeker Permissions
  - Access control verification
  - Operation authorization

## Test Infrastructure

### Base Test Configuration (`TestBase.cs`)

- WebApplicationFactory setup
- In-memory database configuration
- Authentication helpers
- Common test utilities

### Key Testing Patterns

1. **Integration Testing**

   - Full stack testing
   - HTTP request/response cycle
   - Database operations

2. **Authentication & Authorization**

   - Token handling
   - Role-based access
   - Permission validation

3. **Data Operations**

   - CRUD operations
   - Entity relationships
   - Data integrity

4. **Security Testing**
   - Authorization checks
   - Permission boundaries
   - Token verification

## Test Coverage Areas

### Core Functionalities

1. User Management

   - Registration
   - Authentication
   - Authorization
   - Profile management

2. Job Management

   - Posting
   - Updates
   - Search
   - Applications

3. Application Process

   - Submission
   - Status tracking
   - Document handling

4. Administrative Functions
   - User oversight
   - System management
   - Access control

### Security Features

- Role-based access control
- Token authentication
- Permission validation
- Data protection

## Testing Architecture

- Uses xUnit testing framework
- Integration tests with WebApplicationFactory
- In-memory database for isolation
- Clean test data management

## Best Practices

- Isolated test environment
- Clean test data
- Comprehensive coverage
- Clear test naming
- Proper authorization testing
- Error case validation

## Running the Tests

### Run All Tests

To run all tests with normal verbosity:

```bash
dotnet test Tests/Tests.csproj --verbosity normal
```

### Run Specific Test File

To run tests from a specific test file (e.g., AuthenticationTests, AdminTests, etc.):

```bash
dotnet test Tests/Tests.csproj --filter "FullyQualifiedName~{TestFileName}" --verbosity normal
```

Example to run only Authentication tests:

```bash
dotnet test Tests/Tests.csproj --filter "FullyQualifiedName~AuthenticationTests" --verbosity normal
```

The verbosity flag provides detailed output about test execution, making it easier to diagnose issues when tests fail.

## Running the Tests

```bash
dotnet test
```

The test suite provides comprehensive coverage of the Job Portal API's functionality, ensuring reliable operation and proper security measures.
