# V1 IDOR — Appointment Security Test Endpoints

Postman collection: `V1-IDOR-Appointments.postman_collection.json`
Environment: `V1-IDOR-Appointments.postman_environment.json`

Import both into Postman, select the environment, and run folder-by-folder in order (0 → 1 → 2). Fill in `doctorIdentifier`/`doctorPassword` and `otherDoctorIdentifier`/`otherDoctorPassword` in the environment with two existing ACTIVE seeded doctor accounts before running.

## 0. Setup - Accounts & Appointment

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | `http://localhost:1111/api/auth/register` | Register Patient A → saves `patientAToken`, `patientAId` |
| 2 | POST | `http://localhost:1111/api/auth/register` | Register Patient B (attacker) → saves `patientBToken`, `patientBId` |
| 3 | POST | `http://localhost:1111/api/auth/login` | Login owning doctor → saves `doctorToken`, `doctorId` |
| 4 | POST | `http://localhost:1111/api/auth/login` | Login non-owning doctor → saves `otherDoctorToken`, `otherDoctorId` |
| 5 | POST | `http://localhost:1111/api/appointments` | Patient A creates appointment with the doctor → saves `appointmentId` |

## 1. BEFORE-fix Vulnerability Demo (GET, cross-patient)

| # | Method | Endpoint | Caller | Expected |
|---|--------|----------|--------|----------|
| 1 | GET | `http://localhost:1111/api/appointments/:id` | Patient B (attacker) | **403** (was 200 before the fix — this is the core IDOR PoC) |
| 2 | GET | `http://localhost:1111/api/appointments/:id` | Patient A (owner) | 200 (control) |

## 2. Ownership Checks - Write Operations

| # | Method | Endpoint | Caller | Expected |
|---|--------|----------|--------|----------|
| 1 | PUT | `http://localhost:1111/api/appointments/:id` | Patient B (attacker) | 403 |
| 2 | PUT | `http://localhost:1111/api/appointments/:id` | Patient A (owner) | 200 (control) |
| 3 | PATCH | `http://localhost:1111/api/appointments/:id/status` | Non-owning doctor (attacker) | 403 |
| 4 | PATCH | `http://localhost:1111/api/appointments/:id/status` | Owning doctor | 200 (control — transitions to `confirmed`) |
| 5 | PATCH | `http://localhost:1111/api/appointments/:id/reschedule` | Patient B (attacker) | 403 (requires appointment already `confirmed`, i.e. run after #4) |
| 6 | PATCH | `http://localhost:1111/api/appointments/:id/reschedule` | Patient A (owner) | 200 (control) |
| 7 | PATCH | `http://localhost:1111/api/appointments/:id/cancel` | Patient B (attacker) | 403 |
| 8 | PATCH | `http://localhost:1111/api/appointments/:id/cancel` | Patient A (owner) | 200 (control — run last, ends the lifecycle) |
| 9 | DELETE | `http://localhost:1111/api/appointments/:id` | Patient B (attacker) | 403 (only valid while appointment is still `pending`, i.e. run before #4) |

## Notes

- Identity for every ownership check comes only from the JWT (`req.user.userId` / `req.user.role`), never from the request body or query params.
- `DELETE` and `PUT` only succeed on `pending` appointments; `reschedule` only succeeds on `confirmed` appointments — sequence write-operation requests accordingly if re-running against the same appointment.
- No admin bypass exists for appointment ownership checks — there is no admin appointment-management role wired into these routes.
