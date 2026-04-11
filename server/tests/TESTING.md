# CareLine360 - Comprehensive Testing Guide

Complete testing documentation with Unit, Integration, and Performance tests for all modules (Patient, Admin, Appointment, Doctor, Payment).

---

## 📋 Table of Contents

- [Test Structure](#test-structure)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Performance Testing](#performance-testing)
- [Running All Tests](#running-all-tests)
- [Coverage](#coverage)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

---

## Test Structure

### Directory Organization

```
tests/
├── unit/
│   ├── patient/patient.test.js
│   ├── admin/admin.test.js
│   ├── appointment/ (7 test files)
│   │   ├── appointment.test.js
│   │   ├── appointmentController.test.js
│   │   ├── appointmentService.test.js
│   │   (and 4 more)
│   ├── doctor/ (2 test files)
│   └── payment/ (3 test files)
├── integration/
│   ├── patient/patient.test.js
│   ├── admin/admin.test.js
│   ├── appointment/appointment.test.js
│   ├── doctor/doctor.test.js
│   └── payment/payment.test.js
├── artillery/
│   ├── patient-load-test.yml
│   ├── admin-load-test.yml
│   ├── appointment-load-test.yml
│   ├── doctor-load-test.yml
│   ├── generate-payload.js
│   └── performance-processor.js
```

### File Statistics

- **Total Test Files:** 23
- **Unit Test Files:** 14
- **Integration Test Files:** 5
- **Performance Configs:** 4
- **Estimated Test Cases:** 100+
- **Expected Coverage:** 85-95%

---

## Unit Testing

Unit tests focus on individual components in isolation with mocked dependencies.

### Running Unit Tests

```bash
# All unit tests
npm run test:unit

# Specific module
npm run test:patient:unit
npm run test:admin:unit
npm run test:appointment:unit
npm run test:doctor:unit
npm run test:payment:unit
```

### Patient Module

**File:** `tests/unit/patient/patient.test.js`

**Coverage:**

- Profile strength calculations
- Patient profile operations (create, read, update)
- Medical records management
- Prescriptions handling
- Data validation (NIC, blood group, gender)
- Allergies and chronic conditions
- Emergency contact validation

---

### Admin Module

**File:** `tests/unit/admin/admin.test.js`

**Coverage:**

- User CRUD operations
- Doctor verification process
- Status management (ACTIVE, PENDING, REJECTED, SUSPENDED)
- Appointment oversight
- Emergency case handling
- System statistics
- Report generation

---

### Appointment Module

**7 Test Files:**

1. **appointment.test.js** - Core functionality
   - Appointment creation validation
   - Status transitions
   - Rescheduling workflows
   - Cancellation logic
   - Duration calculations

2. **appointmentController.test.js** - API controller
   - HTTP request handling
   - Response formatting
   - Status code validation

3. **appointmentService.test.js** - Business logic
   - Service operations
   - Database interactions (mocked)
   - Business rule enforcement

4. **appointmentValidator.test.js** - Input validation
   - Date/time format validation
   - Consultation type validation
   - Priority validation
   - Status validation

5. **authMiddleware.test.js** - Authentication
   - JWT token validation
   - User identification
   - Permission checks

6. **errorHandler.test.js** - Error handling
   - Error formatting
   - Status code mapping
   - Error message generation

7. **validateRequest.test.js** - Request validation
   - Required fields checking
   - Data type validation
   - Format validation

---

### Doctor Module

**2 Test Files:**

1. **doctorController.test.js** - API controller
   - Profile management endpoints
   - Availability slots endpoints
   - Appointment management endpoints

2. **doctorService.test.js** - Core services
   - Service layer operations
   - Business logic validation
   - State management

---

### Payment Module

**3 Test Files:**

1. **paymentController.test.js** - API controller
   - Payment creation endpoints
   - Payment retrieval
   - Status updates

2. **paymentService.test.js** - Business logic
   - Payment processing
   - Transaction handling
   - Calculation logic

3. **paymentValidator.test.js** - Input validation
   - Amount validation
   - Payment method validation
   - Required field checking

---

## Integration Testing

Integration tests verify components work together with actual database interactions (MongoDB Memory Server).

### Running Integration Tests

```bash
# All integration tests
npm run test:integration

# Specific module
npm run test:patient:integration
npm run test:admin:integration
npm run test:appointment:integration
npm run test:doctor:integration
npm run test:payment:integration
```

### Patient Module Integration

**File:** `tests/integration/patient/patient.test.js`

Tests:

- Patient profile creation workflow
- Profile updates with data validation
- Medical records association
- Database relationships
- Query performance
- Data constraints
- Emergency case management

---

### Admin Module Integration

**File:** `tests/integration/admin/admin.test.js`

Tests:

- User management workflows
- Doctor verification pipeline
- Appointment oversight
- Emergency response management
- Statistics aggregation
- Data integrity
- User role validation

---

### Appointment Module Integration

**File:** `tests/integration/appointment/appointment.test.js`

Tests:

- Full appointment lifecycle (create → confirm → complete)
- Status transition chains
- Rescheduling with history
- Concurrent appointment handling
- Time slot management
- Appointment filtering and pagination
- Statistics by status

---

### Doctor Module Integration

**File:** `tests/integration/doctor/doctor.test.js`

Tests:

- Doctor profile lifecycle
- Availability slot management
- Appointment management
- Patient relationships
- Medical records creation
- Prescription management
- Dashboard analytics

---

### Payment Module Integration

**File:** `tests/integration/payment/payment.test.js`

Tests:

- Payment processing workflows
- Transaction management
- Refund handling
- Payment history retrieval
- Amount validation
- Status tracking

---

## Performance Testing

Performance tests use Artillery.io to simulate concurrent users and measure response times under load.

### Loading Performance Tests

```bash
# Start server first
npm start

# In another terminal, run performance tests
npm run test:patient:perf
npm run test:patient:perf:report
```

### Patient Module Performance

**File:** `tests/artillery/patient-load-test.yml`

**Configuration:**

- Warmup: 5 arrivals/sec for 30 seconds
- Ramp: 20 arrivals/sec for 120 seconds
- Stress: 40 arrivals/sec for 60 seconds

**Endpoints Tested:**

- GET /api/patient/profile
- GET /api/patient/medical-records
- GET /api/patient/prescriptions
- POST /api/patient/profile
- PUT /api/patient/profile
- GET /api/doctors/directory

**Metrics:**

- Target p95 response time: <200ms
- Target throughput: 50+ req/s
- Target error rate: <1%

---

### Admin Module Performance

**File:** `tests/artillery/admin-load-test.yml`

**Configuration:**

- Warmup: 2 arrivals/sec for 30 seconds
- Ramp: 10 arrivals/sec for 120 seconds
- Stress: 30 arrivals/sec for 60 seconds

**Endpoints Tested:**

- GET /api/admin/users
- GET /api/admin/appointments
- POST /api/admin/doctors/verify
- GET /api/admin/statistics
- GET /api/admin/emergencies

---

### Appointment Module Performance

**File:** `tests/artillery/appointment-load-test.yml`

**Configuration:**

- Warmup: 5 arrivals/sec for 30 seconds
- Ramp: 20 arrivals/sec for 120 seconds
- Stress: 50 arrivals/sec for 60 seconds

**Endpoints Tested:**

- POST /api/appointments (create)
- GET /api/appointments (list)
- PUT /api/appointments/:id/status (update)
- POST /api/appointments/:id/reschedule (reschedule)
- DELETE /api/appointments/:id (cancel)

---

### Doctor Module Performance

**File:** `tests/artillery/doctor-load-test.yml`

**Configuration:**

- Warmup: 2 arrivals/sec for 30 seconds
- Ramp: 15 arrivals/sec for 120 seconds
- Stress: 40 arrivals/sec for 60 seconds

**Endpoints Tested:**

- GET /api/doctor/profile
- GET /api/doctor/dashboard/stats
- GET /api/doctor/appointments
- POST /api/doctor/availability
- POST /api/doctor/medical-records
- POST /api/doctor/prescriptions

---

## Running All Tests

### Complete Test Workflow

```bash
# 1. Run all tests (unit + integration, ~15-20 seconds)
npm test

# 2. Run with coverage report (~20-30 seconds)
npm run test:coverage

# 3. Run performance baseline for critical modules (~15+ minutes)
npm run test:patient:perf:report
npm run test:admin:perf:report
npm run test:appointment:perf:report
npm run test:doctor:perf:report
```

### Expected Output

**Unit + Integration Tests:**

```
Test Suites: 19 passed
Tests: 100+ passed
Time: 15-20 seconds
Coverage: 85-95%
```

**Performance Test:**

```
Completed: 5000 requests
Success Rate: 99.8%
Response Time: p50: 120ms, p95: 189ms, p99: 250ms
Throughput: 65.3 req/s
Error Rate: 0.2%
```

---

## Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

### Coverage Thresholds

Set in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

### View HTML Coverage Report

```bash
npm run test:coverage
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows
xdg-open coverage/lcov-report/index.html # Linux
```

---

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**

```bash
# MongoDB Memory Server handles this automatically
# Ensure it's installed:
npm install --save-dev mongodb-memory-server

# Run tests with proper setup
npm test
```

### Test Timeout

**Error:** `Jest did not exit one second after the test run has completed`

**Solution:**

```bash
# Add forceExit flag (already in npm scripts):
npm test -- --forceExit

# Or increase timeout:
npm test -- --testTimeout=60000
```

### Port Conflicts

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**

```bash
# Kill process on port
lsof -ti:5000 | xargs kill -9  # macOS/Linux

# Or use different port
PORT=5001 npm test
```

### Artillery Connection Failures

**Error:** `ENOTFOUND localhost:5000`

**Solution:**

```bash
# Ensure server is running in another terminal
npm start

# Then run performance test
npm run test:patient:perf
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "16"
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```

### Jenkins Pipeline

```groovy
pipeline {
  stages {
    stage('Test') {
      steps {
        sh 'npm run test:unit'
        sh 'npm run test:integration'
        sh 'npm run test:coverage'
      }
    }
    stage('Performance') {
      steps {
        sh 'npm run test:patient:perf:report'
      }
    }
  }
}
```

---

**Last Updated:** April 2024  
**Status:** ✅ Production Ready  
**Test Coverage:** 85-95%

### Patient Module Unit Tests

**File:** `tests/unit/patient.test.js`

**Test Coverage:**

- Profile strength calculation
- Patient profile retrieval
- Medical records management
- Prescriptions management
- Patient data validation
- Emergency contact validation
- Allergies and medical conditions

**Run Command:**

```bash
npm run test:unit -- patient.test.js
```

**Run with Verbose Output:**

```bash
npm run test:unit -- patient.test.js --verbose
```

**Run with Coverage:**

```bash
npm run test:unit -- patient.test.js --coverage
```

**Example Output:**

```
PASS  tests/unit/patient.test.js
  Patient Module - Unit Tests
    Profile Strength Calculator
      ✓ should calculate profile strength with all fields (5ms)
      ✓ should calculate lower profile strength with missing fields (2ms)
      ✓ should return 0 for empty profile (1ms)
    Patient Profile Retrieval
      ✓ should retrieve complete patient profile (8ms)
      ✓ should handle patient not found (3ms)
    ...
```

---

### Admin Module Unit Tests

**File:** `tests/unit/admin.test.js`

**Test Coverage:**

- User management (CRUD)
- Doctor verification
- Appointment management
- Emergency response management
- System statistics
- Data validation
- Report generation

**Run Command:**

```bash
npm run test:unit -- admin.test.js
```

**Watch Mode (Re-run on file changes):**

```bash
npm run test:unit -- admin.test.js --watch
```

---

### Appointment Module Unit Tests

**File:** `tests/unit/appointment.test.js`

**Test Coverage:**

- Appointment creation
- Appointment retrieval
- Status transitions
- Rescheduling
- Cancellation
- Duration and slots
- Reminders
- Consultation types

**Run Command:**

```bash
npm run test:unit -- appointment.test.js
```

---

### Doctor Module Unit Tests

**File:** `tests/unit/doctor.test.js`

**Test Coverage:**

- Doctor profile management
- Avatar management
- Dashboard and analytics
- Availability slots management
- Appointment management
- Patient management
- Medical records management
- Prescription management
- Error handling

**Run Command:**

```bash
npm run test:unit -- doctor.test.js
```

**Run with Coverage:**

```bash
npm run test:unit -- doctor.test.js --coverage
```

---

### Run All Unit Tests

```bash
npm run test:unit
```

**Expected Output:**

```
Test Suites: 4 passed, 4 total
Tests:       75 passed, 75 total
Time:        9.834 s
```

---

## Integration Testing

Integration tests verify that different modules work together correctly and interact with the database properly.

### Patient Module Integration Tests

**File:** `tests/integration/patient.test.js`

**Test Coverage:**

- Patient profile creation workflow
- Profile updates
- Medical records association
- Data validation and constraints
- Emergency creation
- Profile strength calculation
- Query performance
- Data relationships

**Run Command:**

```bash
npm run test:integration -- patient.test.js
```

**What It Tests:**

- Complete user-patient relationship
- Medical records linked to patient
- Profile strength calculation with real data
- Database queries and pagination

---

### Admin Module Integration Tests

**File:** `tests/integration/admin.test.js`

**Test Coverage:**

- User management workflow
- Doctor verification process
- Appointment oversight
- Emergency response management
- System statistics calculation
- Data integrity
- User role management

**Run Command:**

```bash
npm run test:integration -- admin.test.js
```

**Detailed Flow Test:**

```bash
npm run test:integration -- admin.test.js --verbose
```

---

### Appointment Module Integration Tests

**File:** `tests/integration/appointment.test.js`

**Test Coverage:**

- Appointment lifecycle
- Status transitions
- Rescheduling with history
- Appointment retrieval and filtering
- Time management
- Statistics calculation
- Patient-doctor-appointment relationships
- Concurrent appointments

**Run Command:**

```bash
npm run test:integration -- appointment.test.js
```

---

### Doctor Module Integration Tests

**File:** `tests/integration/doctor.test.js`

**Test Coverage:**

- Doctor profile lifecycle
- Availability management
- Appointment management
- Patient management
- Medical records management
- Prescription management
- Dashboard analytics

**Run Command:**

```bash
npm run test:integration -- doctor.test.js
```

**Detailed Flow Test:**

```bash
npm run test:integration -- doctor.test.js --verbose
```

---

### Run All Integration Tests

```bash
npm run test:integration
```

**Expected Output:**

```
Test Suites: 4 passed, 4 total
Tests:       64 passed, 64 total
Time:        16.678 s
```

---

## Performance Testing

Performance tests use Artillery.io to simulate concurrent users and measure API response times under load.

### Setup Artillery Tests

**Prerequisites:**

```bash
npm install --save-dev artillery
```

### Patient Module Performance Test

**File:** `tests/artillery/patient-load-test.yml`

**Simulates:**

- 10-50 concurrent patients
- Profile retrieval
- Medical record access
- Prescription queries
- Doctor/Hospital directory access
- Profile updates

**Generate Test Payload:**

```bash
node tests/artillery/generate-payload.js
```

**Run Test:**

```bash
npx artillery run tests/artillery/patient-load-test.yml
```

**Run with Report Output:**

```bash
npx artillery run --output patient-report.json tests/artillery/patient-load-test.yml && npx artillery report patient-report.json
```

**Expected Metrics:**

- Response time: < 200ms (95th percentile)
- Throughput: 50+ requests/second
- Error rate: < 1%

---

### Admin Module Performance Test

**File:** `tests/artillery/admin-load-test.yml`

**Simulates:**

- 5-30 concurrent admin users
- User management queries
- Appointment oversight
- Statistics retrieval
- Emergency case access
- Doctor verification

**Run Test:**

```bash
npx artillery run tests/artillery/admin-load-test.yml
```

**Run with Report:**

```bash
npx artillery run --output admin-report.json tests/artillery/admin-load-test.yml && npx artillery report admin-report.json
```

---

### Appointment Module Performance Test

**File:** `tests/artillery/appointment-load-test.yml`

**Simulates:**

- 10-50 concurrent users
- Appointment creation
- Status transitions
- Rescheduling
- List retrieval with pagination

**Run Test:**

```bash
npx artillery run tests/artillery/appointment-load-test.yml
```

**Run with Report:**

```bash
npx artillery run --output appointment-report.json tests/artillery/appointment-load-test.yml && npx artillery report appointment-report.json
```

---

### Doctor Module Performance Test

**File:** `tests/artillery/doctor-load-test.yml`

**Simulates:**

- 5-40 concurrent doctors
- Profile management
- Availability slots management
- Appointment workflows
- Patient management
- Medical records and prescriptions
- Dashboard stats retrieval

**Run Test:**

```bash
npx artillery run tests/artillery/doctor-load-test.yml
```

**Run with Report:**

```bash
npx artillery run --output doctor-report.json tests/artillery/doctor-load-test.yml && npx artillery report doctor-report.json
```

---

### Continuous Stress Testing

Run extended load test:

```bash
npx artillery run --duration 300 tests/artillery/patient-load-test.yml
```

Monitor Memory Usage:

```bash
npx artillery run --target http://localhost:5000 --duration 600 \
  --ramp-up 100 --ramp-up-step 10 tests/artillery/patient-load-test.yml
```

---

## Running All Tests

### Run Complete Test Suite

```bash
npm test
```

This runs:

1. All unit tests
2. All integration tests
3. Total time: ~25 seconds

### Run Tests by Module

**Patient Module - All Tests:**

```bash
npm run test -- --testPathPattern="patient"
```

**Admin Module - All Tests:**

```bash
npm run test -- --testPathPattern="admin"
```

**Appointment Module - All Tests:**

```bash
npm run test -- --testPathPattern="appointment"
```

### Run Tests with Coverage Report

```bash
npm run test:unit -- --coverage
npm run test:integration -- --coverage
```

**Generate Combined Coverage Report:**

```bash
npm test -- --coverage --collectCoverageFrom="src/**/*.js"
```

---

## Test Coverage

### Expected Coverage Metrics

```
Statements   : 85-95%
Branches     : 80-90%
Functions    : 85-95%
Lines        : 85-95%
```

### View Coverage Report

```bash
npm test -- --coverage

# Generate HTML report
npm test -- --coverage --collectCoverageFrom="server/**/*.js"

# View in browser
open coverage/lcov-report/index.html
```

---

## Test Scenarios

### Patient Module Test Scenarios

```
1. Profile Management
   - Create/Update/Retrieve patient profile
   - Upload avatar
   - Validate medical information
   - Calculate profile strength

2. Medical Information
   - Retrieve medical records (paginated)
   - Fetch prescriptions
   - AI medical text explanation
   - Medical condition tracking

3. Healthcare Access
   - Browse doctors directory
   - View hospital information
   - Search and filter
   - Emergency creation
```

### Admin Module Test Scenarios

```
1. User Management
   - Create/Read/Update/Delete users
   - Change user status
   - Reset passwords
   - Role management

2. Doctor Verification
   - Review pending doctors
   - Approve/reject applications
   - Verify credentials
   - Track verification history

3. System Oversight
   - View all appointments
   - Monitor emergency cases
   - Generate reports
   - Access system statistics

4. Emergency Response
   - List emergencies by severity
   - Update emergency status
   - Calculate nearest hospital
   - Track responder assignment
```

### Appointment Module Test Scenarios

```
1. Appointment Lifecycle
   - Create appointment
   - Update details
   - Confirm by doctor
   - Mark as completed
   - Cancel appointment

2. Appointment Management
   - Reschedule with history
   - Set reminders
   - Manage time slots
   - Handle concurrent bookings

3. Filtering & Retrieval
   - Filter by status
   - Sort by date
   - Paginate results
   - Patient/doctor specific views
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Error

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**

```bash
# Use MongoDB Memory Server (included in tests)
# Ensure MongoDB Memory Server is installed:
npm install --save-dev mongodb-memory-server

# Run tests
npm test
```

#### 2. Jest Timeout

**Error:** `Jest did not exit one second after the test run has completed`

**Solution:**

```bash
# Add --forceExit flag
npm run test -- --forceExit

# Or increase timeout:
npm run test -- --testTimeout=30000
```

#### 3. Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm test
```

#### 4. Artillery Test Fails

**Error:** `ENOTFOUND localhost:5000`

**Solution:**

```bash
# Ensure server is running
npm start

# Or modify Artillery config to use correct URL
# Edit: tests/artillery/patient-load-test.yml
# Set: target: "http://localhost:5000"
```

#### 5. Test Hangs

**Solution:**

```bash
# Run with timeout
npm run test -- --testTimeout=10000 --forceExit

# Or watch mode issues:
npm run test:unit -- --no-coverage --forceExit
```

---

## Performance Testing Best Practices

### Before Running Load Tests

1. **Clean Database**

   ```bash
   # Clear test data
   npm run test -- --clearCache
   ```

2. **Ensure System Ready**

   ```bash
   # Check server status
   curl http://localhost:5000/api/health
   ```

3. **Monitor System Resources**

   ```bash
   # Terminal 1: Run server
   npm start

   # Terminal 2: Monitor (Mac/Linux)
   top
   # or (Windows)
   Get-Process node | Select-Object CPU, Memory
   ```

### Artillery Configuration

**Adjust Load Levels:**

```yaml
phases:
  - duration: 60
    arrivalRate: 10 # Users arriving per second
    name: "Warm up"
  - duration: 120
    arrivalRate: 20 # Increase load
    name: "Ramp up"
  - duration: 60
    arrivalRate: 50 # Peak load
    name: "Stress"
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "16"
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
```

### Jenkins Pipeline

```groovy
pipeline {
  stages {
    stage('Unit Tests') {
      steps {
        sh 'npm run test:unit'
      }
    }
    stage('Integration Tests') {
      steps {
        sh 'npm run test:integration'
      }
    }
    stage('Performance Tests') {
      steps {
        sh 'npx artillery run tests/artillery/patient-load-test.yml'
      }
    }
  }
}
```

---

## Test Commands Reference

### Quick Reference

```bash
# Unit Tests
npm run test:unit                                    # All unit tests
npm run test:unit -- patient.test.js                # Patient only
npm run test:unit -- admin.test.js                  # Admin only
npm run test:unit -- appointment.test.js            # Appointment only

# Integration Tests
npm run test:integration                            # All integration tests
npm run test:integration -- patient.test.js         # Patient only
npm run test:integration -- admin.test.js           # Admin only
npm run test:integration -- appointment.test.js     # Appointment only

# Complete Test Suite
npm test                                            # All tests
npm test -- --coverage                              # With coverage

# Performance Tests
npx artillery run tests/artillery/patient-load-test.yml
npx artillery run tests/artillery/admin-load-test.yml
npx artillery run tests/artillery/appointment-load-test.yml

# With Reports
npx artillery run --output report.json tests/artillery/patient-load-test.yml
npx artillery report report.json
```

---

## Test Metrics & Benchmarks

### Target Performance Metrics

| Metric              | Target    | Alert      |
| ------------------- | --------- | ---------- |
| Response Time (p95) | < 200ms   | > 500ms    |
| Throughput          | 50+ req/s | < 20 req/s |
| Error Rate          | < 1%      | > 5%       |
| CPU Usage           | < 70%     | > 90%      |
| Memory Usage        | < 512MB   | > 1GB      |

### Example Performance Report

```
Patient Module Performance Test Results:
✓ Completed 5000 requests
✓ Average response time: 125ms
✓ 95th percentile: 189ms
✓ Throughput: 65.3 req/s
✓ Error rate: 0.2%
✓ Connection errors: 0
```

---

## Additional Resources

- [Jest Documentation](https://jestjs.io)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Artillery.io Documentation](https://artillery.io)
- [MongoDB Memory Server](https://github.com/typegoose/mongodb-memory-server)

---

**Last Updated:** April 2024
**Status:** ✅ Production Ready
**Test Coverage:** 85-95%
