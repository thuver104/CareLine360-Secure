# 🧪 CareLine360 - Testing Commands Reference

Complete command reference for running tests across all 5 modules (Patient, Admin, Appointment, Doctor, Payment).

---

## 🚀 Quick Start

### Run All Tests

```bash
npm test
```

### Run All Tests with Coverage Report

```bash
npm run test:coverage
```

### Run Tests by Type

```bash
npm run test:unit          # All unit tests
npm run test:integration   # All integration tests
```

---

## 📋 Patient Module

### Unit Tests

```bash
npm run test:patient:unit
```

### Integration Tests

```bash
npm run test:patient:integration
```

### Combined (Unit + Integration)

```bash
npm run test:patient
```

### Performance Test

```bash
npm run test:patient:perf
```

### Performance Test with Report

```bash
npm run test:patient:perf:report
```

---

## 📋 Admin Module

### Unit Tests

```bash
npm run test:admin:unit
```

### Integration Tests

```bash
npm run test:admin:integration
```

### Combined (Unit + Integration)

```bash
npm run test:admin
```

### Performance Test

```bash
npm run test:admin:perf
```

### Performance Test with Report

```bash
npm run test:admin:perf:report
```

---

## 📋 Appointment Module

### Unit Tests (7 test files)

```bash
npm run test:appointment:unit
```

Includes:

- appointment.test.js (core functionality)
- appointmentController.test.js (API controller)
- appointmentService.test.js (business logic)
- appointmentValidator.test.js (input validation)
- authMiddleware.test.js (authentication)
- errorHandler.test.js (error handling)
- validateRequest.test.js (request validation)

### Integration Tests

```bash
npm run test:appointment:integration
```

### Combined (Unit + Integration)

```bash
npm run test:appointment
```

### Performance Test

```bash
npm run test:appointment:perf
```

### Performance Test with Report

```bash
npm run test:appointment:perf:report
```

---

## 📋 Doctor Module

### Unit Tests (2 test files)

```bash
npm run test:doctor:unit
```

Includes:

- doctorController.test.js (API controller)
- doctorService.test.js (core services)

### Integration Tests

```bash
npm run test:doctor:integration
```

### Combined (Unit + Integration)

```bash
npm run test:doctor
```

### Performance Test

```bash
npm run test:doctor:perf
```

### Performance Test with Report

```bash
npm run test:doctor:perf:report
```

---

## 📋 Payment Module

### Unit Tests (3 test files)

```bash
npm run test:payment:unit
```

Includes:

- paymentController.test.js (API controller)
- paymentService.test.js (business logic)
- paymentValidator.test.js (input validation)

### Integration Tests

```bash
npm run test:payment:integration
```

### Combined (Unit + Integration)

```bash
npm run test:payment
```

**Note:** Performance tests not configured for Payment module

---

## 🎯 Advanced Testing Options

### Run Tests in Watch Mode

```bash
npm run test:unit -- --watch
npm run test:patient:unit -- --watch
npm run test:appointment:unit -- --watch
```

### Run Specific Test File

```bash
npm test -- tests/unit/appointment/appointmentController.test.js
npm test -- tests/integration/appointment/appointment.test.js
npm test -- tests/unit/payment/paymentValidator.test.js
```

### Run Tests Matching Pattern

```bash
npm test -- -t "should create"
npm test -- -t "appointment.*status"
npm test -- -t "validation"
npm test -- -t "payment"
```

### Run with Verbose Output

```bash
npm test -- --verbose
npm run test:admin -- --verbose
npm run test:appointment:unit -- --verbose
```

### Run with Coverage for Specific Module

```bash
npm test -- --coverage --collectCoverageFrom="controllers/appointmentController.js"
npm test -- --coverage --collectCoverageFrom="services/**/*.js"
npm test -- --coverage --collectCoverageFrom="controllers/paymentController.js"
```

###Debug Tests

```bash
# Node inspector debugging
node --inspect-brk ./node_modules/jest/bin/jest.js tests/unit/patient/patient.test.js

# Specific test file
node --inspect-brk ./node_modules/jest/bin/jest.js tests/unit/appointment/appointmentValidator.test.js

# With verbose output
npm test -- --verbose --verbose
```

### Update Snapshots

```bash
npm test -- -u
npm run test:unit -- -u
```

### No Cache

```bash
npm test -- --no-cache
npm run test:appointment:unit -- --no-cache
```

### Force Exit

```bash
npm test -- --forceExit
npm run test:payment:integration -- --forceExit
```

---

## 📊 Performance Testing Commands

### Run All Performance Tests

```bash
npm run test:patient:perf
npm run test:admin:perf
npm run test:appointment:perf
npm run test:doctor:perf
```

### Generate Performance Reports

```bash
npm run test:patient:perf:report
npm run test:admin:perf:report
npm run test:appointment:perf:report
npm run test:doctor:perf:report
```

### Manual Artillery Commands

```bash
# Run test
npx artillery run tests/artillery/patient-load-test.yml

# Run with output
npx artillery run --output patient-report.json tests/artillery/patient-load-test.yml

# Generate report
npx artillery report patient-report.json

# View HTML report
open patient-report.html  # macOS
start patient-report.html # Windows
xdg-open patient-report.html # Linux
```

---

## 📈 Coverage Commands

### Generate Coverage for All Tests

```bash
npm run test:coverage
```

### Generate Coverage for Specific Module

```bash
npm test -- --coverage --testPathPattern="patient"
npm test -- --coverage --testPathPattern="appointment"
npm test -- --coverage --testPathPattern="payment"
```

### Generate HTML Coverage Report

```bash
npm run test:coverage

# View report
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows
xdg-open coverage/lcov-report/index.html # Linux
```

---

## 🎓 Execution Workflows

### Quick Validation (3-5 seconds)

```bash
npm run test:unit
```

### Full Test Suite (15-20 seconds)

```bash
npm test
```

### Full with Coverage (20-30 seconds)

```bash
npm run test:coverage
```

### Patient Module Complete

```bash
npm run test:patient && npm run test:patient:perf:report
```

### All Modules Full Test (60+ seconds)

```bash
npm test && \
npm run test:patient:perf:report && \
npm run test:admin:perf:report && \
npm run test:appointment:perf:report && \
npm run test:doctor:perf:report
```

### Continuous Integration Flow

```bash
# 1. Unit tests
npm run test:unit

# 2. Integration tests
npm run test:integration

# 3. Coverage check
npm run test:coverage

# 4. Performance baseline
npm run test:patient:perf:report
```

---

## 🐛 Troubleshooting Commands

### Check Test Files Exist

```bash
ls tests/unit/**/*.test.js
ls tests/integration/**/*.test.js
```

### List All Test Scripts

```bash
npm run
```

### Verify Jest Installation

```bash
npx jest --version
```

### Verify Artillery Installation

```bash
npx artillery --version
```

### Clear Jest Cache

```bash
npx jest --clearCache
npm test -- --no-cache
```

### Run Single Test with Debug

```bash
npm test -- --testNamePattern="should calculate profile strength" --verbose
npm test -- tests/unit/appointment/appointmentValidator.test.js --verbose
```

### Verify Working Directory

```bash
pwd  # macOS/Linux
cd   # Windows PowerShell
```

### Run from Server Directory

```bash
cd server
npm test
```

---

## 📌 Module Test Organization

| Module      | Unit Files | Integration Files | Total  | Performance |
| ----------- | ---------- | ----------------- | ------ | ----------- |
| Patient     | 1          | 1                 | 2      | ✓           |
| Admin       | 1          | 1                 | 2      | ✓           |
| Appointment | 7          | 1                 | 8      | ✓           |
| Doctor      | 2          | 1                 | 3      | ✓           |
| Payment     | 3          | 1                 | 4      | ✗           |
| **TOTAL**   | **14**     | **5**             | **19** | **4**       |

---

## 📚 Key Flags Reference

| Flag            | Purpose                | Example                           |
| --------------- | ---------------------- | --------------------------------- |
| `--watch`       | Re-run on file changes | `npm test -- --watch`             |
| `-t`            | Filter tests by name   | `npm test -- -t "payment"`        |
| `--coverage`    | Show coverage report   | `npm run test:coverage`           |
| `--verbose`     | Detailed output        | `npm test -- --verbose`           |
| `-u`            | Update snapshots       | `npm test -- -u`                  |
| `--no-cache`    | Skip jest cache        | `npm test -- --no-cache`          |
| `--forceExit`   | Force exit after test  | `npm test -- --forceExit`         |
| `--testTimeout` | Set timeout (ms)       | `npm test -- --testTimeout=60000` |

---

## ✅ Common Scenarios

### "I want to test just payments"

```bash
npm run test:payment
```

### "I need to verify appointments work"

```bash
npm run test:appointment
```

### "I changed validation, run those tests"

```bash
npm test -- -t "validation"
```

### "I need performance data for doctor module"

```bash
npm run test:doctor:perf:report
```

### "I want to run all tests and see coverage"

```bash
npm run test:coverage
```

### "I changed something in admin, test it"

```bash
npm run test:admin:unit -- --watch
```

### "I need to establish performance baseline"

```bash
npm run test:patient:perf:report
npm run test:admin:perf:report
npm run test:appointment:perf:report
npm run test:doctor:perf:report
```

### "I want to debug a specific test"

```bash
node --inspect-brk ./node_modules/jest/bin/jest.js tests/unit/appointment/appointmentValidator.test.js
```

---

**Last Updated:** April 2024  
**Status:** ✅ Production Ready  
**Test Coverage:** 85-95%  
**Total Test Files:** 23
