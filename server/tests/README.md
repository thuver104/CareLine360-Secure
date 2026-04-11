# 🧪 CareLine360 - Testing Suite Overview

Complete testing infrastructure with Unit, Integration, and Performance tests for all core modules.

---

## 📁 Test Directory Structure

```
server/tests/
├── unit/                           # Unit Tests (Fast, Isolated)
│   ├── patient/
│   │   └── patient.test.js
│   ├── admin/
│   │   └── admin.test.js
│   ├── appointment/
│   │   ├── appointment.test.js
│   │   ├── appointmentController.test.js
│   │   ├── appointmentService.test.js
│   │   ├── appointmentValidator.test.js
│   │   ├── authMiddleware.test.js
│   │   ├── errorHandler.test.js
│   │   └── validateRequest.test.js
│   ├── doctor/
│   │   ├── doctorController.test.js
│   │   └── doctorService.test.js
│   └── payment/
│       ├── paymentController.test.js
│       ├── paymentService.test.js
│       └── paymentValidator.test.js
│
├── integration/                    # Integration Tests (Moderate Speed, Database)
│   ├── patient/
│   │   └── patient.test.js
│   ├── admin/
│   │   └── admin.test.js
│   ├── appointment/
│   │   └── appointment.test.js
│   ├── doctor/
│   │   └── doctor.test.js
│   └── payment/
│       └── payment.test.js
│
├── artillery/                      # Performance Tests (Load Testing)
│   ├── patient-load-test.yml
│   ├── admin-load-test.yml
│   ├── appointment-load-test.yml
│   ├── doctor-load-test.yml
│   ├── generate-payload.js
│   ├── performance-processor.js
│   └── load-test.yml
│   │
├── TESTING.md                        # Comprehensive testing guide
├── TEST_COMMANDS.md                  # Quick reference with all commands
├── setup.js                          # Jest setup & global utilities
└── README.md                         # This file (overview & statistics)

Root Configuration:
├── jest.config.js                    # Jest configuration
└── package.json                      # npm test scripts
```

---

## 📊 Module Test Structure

| Module          | Unit Tests   | Integration Tests | Performance   | Total Test Files |
| --------------- | ------------ | ----------------- | ------------- | ---------------- |
| **Patient**     | 1 file       | 1 file            | ✓             | 2                |
| **Admin**       | 1 file       | 1 file            | ✓             | 2                |
| **Appointment** | 7 files      | 1 file            | ✓             | 8                |
| **Doctor**      | 2 files      | 1 file            | ✓             | 3                |
| **Payment**     | 3 files      | 1 file            | ✗             | 4                |
| **TOTAL**       | **14 files** | **5 files**       | **4 configs** | **23 files**     |

---

## 🧪 Test Coverage Summary

### Patient Module Tests

**Unit Tests (patient.test.js)**

```
✓ Profile Strength Calculation
✓ Patient Profile Operations
✓ Medical Records Management
✓ Prescriptions Data Handling
✓ Emergency Contacts
✓ Data Validation
✓ Allergies & Conditions
```

**Integration Tests (patient.test.js)**

```
✓ Patient Profile Workflow
✓ Medical Record Associations
✓ Data Relationships & Constraints
✓ Query Performance
✓ Emergency Case Management
```

**Performance Tests**

- Concurrent patients: 10-50
- Endpoints: Profile access, record queries, directory search
- Target: <200ms p95 response time

---

### Admin Module Tests

**Unit Tests (admin.test.js)**

```
✓ User Management (CRUD)
✓ Doctor Verification Process
✓ Appointment Oversight
✓ Emergency Response
✓ System Statistics
✓ Permission Validation
✓ Report Generation
```

**Integration Tests (admin.test.js)**

```
✓ User Management Workflows
✓ Doctor Verification Pipeline
✓ Appointment Monitoring
✓ Emergency Management
✓ Statistics Aggregation
```

**Performance Tests**

- Concurrent admins: 5-30
- Endpoints: User queries, stats retrieval, monitoring
- Target: <200ms p95 response time

---

### Appointment Module Tests

**Unit Test Files**

```
✓ appointment.test.js              - Core functionality
✓ appointmentController.test.js    - API controller
✓ appointmentService.test.js       - Business logic
✓ appointmentValidator.test.js     - Input validation
✓ authMiddleware.test.js           - Authentication
✓ errorHandler.test.js             - Error handling
✓ validateRequest.test.js          - Request validation
```

**Integration Tests (appointment.test.js)**

```
✓ Full Appointment Lifecycle
✓ Status Transitions
✓ Rescheduling Workflows
✓ Time Slot Management
✓ Concurrent Bookings
✓ Performance Metrics
```

**Performance Tests**

- Concurrent users: 10-50
- Workflows: CRUD, status changes, rescheduling
- Target: <200ms p95 response time

---

### Doctor Module Tests

**Unit Test Files**

```
✓ doctorController.test.js  - API endpoints
✓ doctorService.test.js     - Core services
```

**Integration Tests (doctor.test.js)**

```
✓ Doctor Profile Lifecycle
✓ Availability Management
✓ Appointment Management
✓ Patient Management
✓ Medical Records
✓ Dashboard Analytics
```

**Performance Tests**

- Concurrent doctors: 5-40
- Operations: Profile management, appointments, records
- Target: <200ms p95 response time

---

### Payment Module Tests

**Unit Test Files**

```
✓ paymentController.test.js - API controller
✓ paymentService.test.js    - Payment logic
✓ paymentValidator.test.js  - Input validation
```

**Integration Tests (payment.test.js)**

```
✓ Payment Processing
✓ Transaction Management
✓ Refund Workflows
✓ Payment History
```

**Performance Tests**: Not configured (optional)

---

## 🎯 Quick Start Commands

### Run All Tests

```bash
npm test
```

### Run Tests by Type

```bash
npm run test:unit          # All unit tests
npm run test:integration   # All integration tests
npm run test:coverage      # All tests with coverage report
```

### Run Tests by Module

```bash
# Patient Module
npm run test:patient       # Unit + Integration
npm run test:patient:unit  # Unit only
npm run test:patient:integration  # Integration only
npm run test:patient:perf  # Performance test
npm run test:patient:perf:report  # Performance with HTML report

# Admin Module
npm run test:admin          # Unit + Integration
npm run test:admin:unit     # Unit only
npm run test:admin:integration     # Integration only
npm run test:admin:perf     # Performance test
npm run test:admin:perf:report     # Performance with HTML report

# Appointment Module
npm run test:appointment      # Unit + Integration
npm run test:appointment:unit # Unit only
npm run test:appointment:integration  # Integration only
npm run test:appointment:perf # Performance test
npm run test:appointment:perf:report  # Performance with HTML report

# Doctor Module
npm run test:doctor         # Unit + Integration
npm run test:doctor:unit    # Unit only
npm run test:doctor:integration  # Integration only
npm run test:doctor:perf    # Performance test
npm run test:doctor:perf:report  # Performance with HTML report
```

---

## 🧪 Test Type Descriptions

### Unit Tests

- **Focus:** Individual functions and components
- **Isolation:** No database or external services
- **Speed:** Very fast (~2-5 seconds)
- **Structure:**
  - Controller tests: API endpoint handling
  - Service tests: Business logic
  - Validator tests: Input validation
  - Middleware tests: Authentication & error handling
- **Examples:**
  - Input validation functions
  - Status transition logic
  - Payment calculations
  - Permission checks

### Integration Tests

- **Focus:** Multiple components working together
- **Scope:** Database interactions (MongoDB Memory Server)
- **Speed:** Moderate (~8-15 seconds)
- **Examples:**
  - Complete workflow testing
  - Database relationships
  - Multi-step operations
  - Data constraint validation

### Performance Tests

- **Focus:** API behavior under concurrent load
- **Scope:** Full HTTP API endpoints
- **Speed:** Variable (1-5 minutes per module)
- **Tool:** Artillery.io
- **Scenarios:**
  - Ramping up concurrent users (warmup → ramp → stress)
  - Response time measurement (p50, p95, p99)
  - Throughput calculation
  - Error rate monitoring

---

## 📈 Test Execution Timeline

When running `npm test`:

```
┌────────────────────────────────────────────────────┐
│ Phase 1: Unit Tests (~3-5 seconds)                 │
├────────────────────────────────────────────────────┤
│  • Patient unit tests                              │
│  • Admin unit tests                                │
│  • Appointment unit tests (7 files)                │
│  • Doctor unit tests                               │
│  • Payment unit tests                              │
├────────────────────────────────────────────────────┤
│ Phase 2: Integration Tests (~8-12 seconds)        │
├────────────────────────────────────────────────────┤
│  • Patient integration tests                       │
│  • Admin integration tests                         │
│  • Appointment integration tests                   │
│  • Doctor integration tests                        │
│  • Payment integration tests                       │
├────────────────────────────────────────────────────┤
│ Phase 3: Coverage Report (optional)               │
│  • Total: 85-95% coverage                         │
└────────────────────────────────────────────────────┘
       Total Time: ~15-20 seconds
```

---

## 📊 Test Statistics

| Metric                             | Value   |
| ---------------------------------- | ------- |
| Total Test Files                   | 23      |
| Unit Test Files                    | 14      |
| Integration Test Files             | 5       |
| Performance Configs                | 4       |
| Modules with Tests                 | 5       |
| Expected Coverage                  | 85-95%  |
| Unit Test Run Time                 | 3-5s    |
| Integration Test Run Time          | 8-12s   |
| Full Test Suite Time               | ~15-20s |
| Performance Test Time (per module) | 2-5 min |
| Est. Total Test Cases              | 100+    |

---

## 🔍 Key Test Scenarios

### Patient Module

1. **Profile Management**
   - Create and update patient profile
   - Calculate profile strength
   - Upload avatar images
   - Retrieve with pagination

2. **Medical Information**
   - Store and retrieve medical records
   - Manage prescriptions
   - Track allergies and conditions
   - Emergency contact management

3. **Healthcare Operations**
   - Browse doctors directory
   - View hospital information
   - Create emergency cases
   - Search and filter

### Admin Module

1. **User Management**
   - Create/read/update/delete users
   - Change user status (ACTIVE, PENDING, SUSPENDED)
   - Reset passwords
   - Role-based access control

2. **Doctor Verification**
   - Review pending doctor applications
   - Approve or reject applications
   - Verify credentials and licenses
   - Track verification history

3. **System Monitoring**
   - Monitor all appointments
   - Manage emergency cases
   - Generate system reports
   - View aggregated statistics

### Appointment Module

1. **Appointment Lifecycle**
   - Create appointments
   - Confirm/cancel appointments
   - Mark as completed
   - Update appointment details

2. **Appointment Management**
   - Reschedule with history tracking
   - Set appointment reminders
   - Manage time slot conflicts
   - Handle concurrent bookings

3. **Filtering & Analytics**
   - Filter by status (pending, confirmed, completed)
   - Sort by date and priority
   - Paginate results
   - Calculate statistics

4. **Validation**
   - Date/time format validation
   - Consultation type validation
   - Status transition validation
   - Authorization checks

### Doctor Module

1. **Profile Management**
   - Create doctor profile
   - Update specialization and qualifications
   - Manage avatar image
   - Track experience level

2. **Availability Management**
   - Add availability slots (by day/time)
   - Update slot capacity
   - Delete slots
   - Manage booking limits

3. **Professional Operations**
   - View assigned appointments
   - Update appointment status
   - Manage patient relationships
   - Create medical records
   - Issue prescriptions

4. **Analytics**
   - Dashboard statistics
   - Appointment trends
   - Patient demographics
   - Performance metrics

### Payment Module

1. **Payment Processing**
   - Create payment records
   - Track payment status
   - Calculate amounts
   - Generate invoices

2. **Transaction Management**
   - Process payments
   - Handle refunds
   - Track payment history
   - Validate payment methods

3. **Validation**
   - Amount validation
   - Payment method validation
   - Date validation
   - Authorization checks

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All unit tests pass (`npm run test:unit`)
- [ ] All integration tests pass (`npm run test:integration`)
- [ ] No console errors or warnings
- [ ] Code coverage > 80% (`npm run test:coverage`)
- [ ] Performance tests baseline established for critical modules
- [ ] No flaky or timeout issues
- [ ] All security validations active
- [ ] Database migrations tested

---

## 🚀 Continuous Integration

### GitHub Actions

```yaml
- Run: npm test
- Generate coverage report
- Upload to codecov
```

### Jenkins

```groovy
stage('Test') {
  steps {
    sh 'npm test'
    sh 'npm run test:coverage'
  }
}
```

---

## 📚 Additional Resources

- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide
- **[TEST_COMMANDS.md](./TEST_COMMANDS.md)** - Quick command reference
- **[setup.js](./setup.js)** - Jest configuration and test utilities
- **[jest.config.js](../jest.config.js)** - Jest configuration file

---

## 🆘 Getting Help

### Common Issues

1. **Tests timeout** → Increase timeout in jest.config.js
2. **Database connection errors** → MongoDB Memory Server handles this
3. **Port conflicts** → Change port in Artillery config
4. **Coverage issues** → Check collectCoverageFrom in jest.config.js

### Debugging Tests

```bash
# Debug specific test
node --inspect-brk node_modules/jest/bin/jest.js tests/unit/patient.test.js

# Run single test case
npm test -- -t "should calculate profile strength"

# Verbose output
npm test -- --verbose
```

---

## 📝 Test Maintenance

### Add New Test

1. Create file: `tests/unit/newmodule.test.js`
2. Follow existing test structure
3. Use testUtils from setup.js
4. Add test command to package.json
5. Update this README

### Update Existing Test

1. Modify test file
2. Run: `npm test -- --watch`
3. Verify coverage remains > 80%
4. Commit changes

### Performance Baseline

```bash
# Establish baseline
npm run test:patient:perf:report

# Compare against new changes
npm run test:patient:perf:report
```

---

## 🎓 Best Practices

✅ **Do:**

- Run tests before committing
- Keep tests isolated and independent
- Use meaningful test descriptions
- Mock external dependencies
- Maintain consistent file structure

❌ **Don't:**

- Skip flaky tests (fix them)
- Commit with failing tests
- Remove test coverage
- Use setTimeout in tests
- Test implementation details

---

## 📞 Support

For issues or questions:

1. Check [TESTING.md](./TESTING.md)
2. Review test files for examples
3. Check jest.config.js configuration
4. Review setup.js utilities

---

**Version:** 1.0.0
**Last Updated:** April 2024
**Status:** ✅ Production Ready
**Test Coverage:** 85-95%
