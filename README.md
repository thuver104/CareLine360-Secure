# CareLine360

A full-stack **MERN** web application for remote medical consultation and emergency assistance — connecting patients, doctors, responders, and administrators on a single healthcare platform.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributors](#contributors)
- [License](#license)

---

## Features

### Patient Portal

- Book in-person / video / phone consultations with doctors
- Real-time chat with doctors during appointments (Socket.io)
- AI-powered medical assistant (Gemini + Groq)
- Upload & manage medical documents (Cloudinary storage)
- View medical history, prescriptions & payment receipts (PDF generation)
- SOS emergency case submission with GPS coordinates
- Profile strength indicator for completion tracking

### Doctor Portal

- Manage availability slots and consultation fees
- View upcoming appointments with auto-generated Jitsi meeting links
- In-appointment chat, prescriptions & medical records
- Rating & review system per appointment
- Analytics dashboard with appointment statistics

### Admin Dashboard

- User management (CRUD, status toggle, role assignment)
- Appointment meeting link assignment
- Analytics & report generation (PDF / CSV / Excel)
- Emergency case monitoring with dispatcher controls
- Email & SMS notifications (Resend + SMSLenz)

### Emergency & Responder

- Emergency case lifecycle: **PENDING -> DISPATCHED -> ARRIVED -> RESOLVED**
- Nearest hospital lookup by GPS coordinates
- Responder-specific dashboard with case assignments

### Real-Time Features

- Socket.io appointment-scoped chat with typing indicators
- Background cron schedulers for meeting reminders (10 min before) and appointment reminders (24 hrs before)

---

## Tech Stack

| Layer            | Technology                                               |
| ---------------- | -------------------------------------------------------- |
| **Frontend**     | React 19, Vite 7, Tailwind CSS 4, React Router 7         |
| **Backend**      | Node.js, Express 5, Mongoose (MongoDB)                   |
| **Real-Time**    | Socket.io 4                                              |
| **Auth**         | JWT (access + refresh tokens), role-based access control |
| **File Storage** | Cloudinary                                               |
| **Email**        | Resend API                                               |
| **SMS**          | SMSLenz API                                              |
| **AI**           | Google Gemini API, Groq API                              |
| **PDF**          | jsPDF (client), PDFKit (server)                          |
| **Maps**         | Leaflet / React-Leaflet                                  |
| **Charts**       | Chart.js / react-chartjs-2                               |
| **Video**        | Jitsi Meet (auto-generated meeting links)                |
| **Testing**      | Jest, Supertest, mongodb-memory-server, Artillery.io     |

---

## Project Structure

```
CareLine360-WebApp-MERN/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── api/              # Axios API modules
│       ├── auth/             # Auth storage & helpers
│       ├── components/       # Reusable UI components
│       ├── context/          # React Context providers (Theme, User, Toast)
│       ├── layouts/          # Layout wrappers (Admin, Doctor, Patient)
│       ├── pages/            # Route-level page components
│       ├── routes/           # React Router config & ProtectedRoute
│       ├── socket/           # Socket.io client setup
│       └── utils/            # Helpers & constants
├── server/                   # Express backend
│   ├── config/               # DB & Cloudinary config
│   ├── controllers/          # Route handler logic
│   ├── middleware/            # Auth, upload, validation, error handling
│   ├── models/               # Mongoose schemas (15 models)
│   ├── routes/               # Express route definitions
│   ├── services/             # Business logic layer
│   ├── socket/               # Socket.io event handlers
│   ├── validators/           # Express-validator schemas
│   ├── utils/                # Helpers (OTP, tokens, distance)
│   ├── tests/                # Unit, integration & performance tests
│   └── server.js             # App entry point
├── postman/                  # Postman collection & environment
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **MongoDB** (local or Atlas)
- **Resend** account (for email notifications)

### Installation

```bash
# Clone the repository
git clone https://github.com/shajana9/CareLine360-WebApp-MERN.git
cd CareLine360-WebApp-MERN

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Configuration

Copy the example env files and fill in your credentials:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Run Development Servers

```bash
# Terminal 1 — Backend (port 1111)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

---

## Environment Variables

### Server (`server/.env`)

| Variable                | Description                                  |
| ----------------------- | -------------------------------------------- |
| `PORT`                  | Server port (default: `1111`)                |
| `MONGO_URI`             | MongoDB connection string                    |
| `NODE_ENV`              | `development` or `production`                |
| `CLIENT_URL`            | Frontend URL for CORS                        |
| `JWT_ACCESS_SECRET`     | Access token signing key                     |
| `JWT_REFRESH_SECRET`    | Refresh token signing key                    |
| `JWT_EXPIRE`            | Token expiry duration (e.g. `7d`)            |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                       |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                           |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                        |
| `RESEND_API_KEY`        | Resend API key for email notifications       |
| `EMAIL_FROM`            | Sender email (e.g. `onboarding@resend.dev`)  |
| `EMAIL_OVERRIDE_TO`     | Override all emails to this address (dev only)|
| `GEMINI_API_KEY`        | Google Gemini API key                        |
| `SMSLENZ_USER_ID`       | SMSLenz user ID                              |
| `SMSLENZ_API_KEY`       | SMSLenz API key                              |

### Client (`client/.env`)

| Variable            | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `VITE_API_URL`      | Backend API base URL (default: `http://localhost:1111/api`) |
| `VITE_GROQ_API_KEY` | Groq API key for AI chat                                    |

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint                      | Auth | Description                     |
| ------ | ----------------------------- | ---- | ------------------------------- |
| POST   | `/api/auth/register`          | No   | Register a new user             |
| POST   | `/api/auth/login`             | No   | Login and receive tokens        |
| POST   | `/api/auth/refresh`           | No   | Refresh access token            |
| POST   | `/api/auth/logout`            | Yes  | Logout and invalidate token     |
| GET    | `/api/auth/me`                | Yes  | Get current authenticated user  |
| POST   | `/api/auth/email/send-verify-otp` | No | Send email verification OTP |
| POST   | `/api/auth/email/verify-otp`  | No   | Verify email OTP                |
| POST   | `/api/auth/password/forgot`   | No   | Request password reset OTP      |
| POST   | `/api/auth/password/reset`    | No   | Reset password with OTP         |
| POST   | `/api/auth/reactivate`        | No   | Reactivate deactivated account  |

### Appointments (`/api/appointments`)

| Method | Endpoint                              | Auth   | Description                     |
| ------ | ------------------------------------- | ------ | ------------------------------- |
| POST   | `/api/appointments`                   | Patient | Create a new appointment       |
| GET    | `/api/appointments`                   | Yes    | List appointments (filterable)  |
| GET    | `/api/appointments/stats`             | Yes    | Get appointment statistics      |
| GET    | `/api/appointments/:id`               | Yes    | Get appointment by ID           |
| PUT    | `/api/appointments/:id`               | Yes    | Update appointment details      |
| DELETE | `/api/appointments/:id`               | Yes    | Delete an appointment           |
| PATCH  | `/api/appointments/:id/status`        | Doctor | Transition appointment status   |
| PATCH  | `/api/appointments/:id/reschedule`    | Yes    | Reschedule appointment          |
| PATCH  | `/api/appointments/:id/cancel`        | Yes    | Cancel appointment with reason  |
| POST   | `/api/appointments/:id/rating`        | Patient | Submit rating for appointment  |
| GET    | `/api/appointments/:id/rating`        | Yes    | Get appointment rating          |

### Chat (`/api/chat`)

| Method | Endpoint                       | Auth | Description                           |
| ------ | ------------------------------ | ---- | ------------------------------------- |
| GET    | `/api/chat/inbox`              | Yes  | Chat inbox with last messages         |
| GET    | `/api/chat/unread/count`       | Yes  | Total unread message count            |
| GET    | `/api/chat/:appointmentId`     | Yes  | Message history for an appointment    |

> Real-time messaging is handled via Socket.io events: `join_room`, `send_message`, `new_message`

### Payments (`/api/payments`)

| Method | Endpoint                                | Auth | Description                    |
| ------ | --------------------------------------- | ---- | ------------------------------ |
| POST   | `/api/payments`                         | Yes  | Create a payment               |
| GET    | `/api/payments/appointment/:appointmentId` | Yes | Get payment by appointment  |
| GET    | `/api/payments/:id`                     | Yes  | Get payment by ID              |
| PATCH  | `/api/payments/:id/verify`              | Yes  | Verify a payment               |
| PATCH  | `/api/payments/:id/fail`                | Yes  | Mark payment as failed         |
| GET    | `/api/payments/:id/receipt`             | Yes  | Generate & download PDF receipt|

### Patients (`/api/patients`)

| Method | Endpoint                        | Auth    | Description                     |
| ------ | ------------------------------- | ------- | ------------------------------- |
| GET    | `/api/patients/me`              | Patient | Get my profile                  |
| PATCH  | `/api/patients/me`              | Patient | Update my profile               |
| PATCH  | `/api/patients/me/avatar`       | Patient | Upload avatar                   |
| DELETE | `/api/patients/me/avatar`       | Patient | Remove avatar                   |
| PATCH  | `/api/patients/me/deactivate`   | Patient | Deactivate account              |
| POST   | `/api/patients/me/ai-explain`   | Patient | AI medical text explanation     |
| GET    | `/api/patients/me/medical-record`| Patient | Get my medical records         |
| GET    | `/api/patients/me/prescription` | Patient | Get my prescriptions            |
| GET    | `/api/patients/doctor`          | Patient | List all doctors                |
| GET    | `/api/patients/doctor/:id`      | Patient | Get doctor details              |
| GET    | `/api/patients/hospital`        | Patient | List all hospitals              |
| GET    | `/api/patients/hospital/:id`    | Patient | Get hospital details            |

### Doctors (`/api/doctor`)

| Method | Endpoint                                | Auth   | Description                       |
| ------ | --------------------------------------- | ------ | --------------------------------- |
| GET    | `/api/doctor/public`                    | No     | List all doctors (public)         |
| GET    | `/api/doctor/public/:id`                | No     | Doctor public profile             |
| POST   | `/api/doctor/profile`                   | Doctor | Create doctor profile             |
| GET    | `/api/doctor/profile`                   | Doctor | Get my profile                    |
| PUT    | `/api/doctor/profile`                   | Doctor | Update my profile                 |
| PUT    | `/api/doctor/profile/avatar`            | Doctor | Update avatar                     |
| GET    | `/api/doctor/dashboard`                 | Doctor | Dashboard summary                 |
| GET    | `/api/doctor/analytics`                 | Doctor | Analytics data                    |
| GET    | `/api/doctor/availability`              | Doctor | Get availability slots            |
| POST   | `/api/doctor/availability`              | Doctor | Add availability slots            |
| PUT    | `/api/doctor/availability/:slotId`      | Doctor | Update availability slot          |
| DELETE | `/api/doctor/availability/:slotId`      | Doctor | Delete availability slot          |
| GET    | `/api/doctor/appointments`              | Doctor | List my appointments              |
| PATCH  | `/api/doctor/appointments/:appointmentId`| Doctor | Update appointment status        |
| DELETE | `/api/doctor/appointments/:appointmentId`| Doctor | Delete appointment               |
| GET    | `/api/doctor/meetings`                  | Doctor | Get video call appointments       |
| GET    | `/api/doctor/patients`                  | Doctor | List my patients                  |
| GET    | `/api/doctor/patients/:patientId`       | Doctor | Get patient detail                |
| POST   | `/api/doctor/records`                   | Doctor | Create medical record             |
| GET    | `/api/doctor/records/:patientId`        | Doctor | Get records by patient            |
| PUT    | `/api/doctor/records/:recordId`         | Doctor | Update medical record             |
| POST   | `/api/doctor/prescriptions`             | Doctor | Save prescription                 |
| POST   | `/api/doctor/prescriptions/generate`    | Doctor | Generate prescription PDF         |
| GET    | `/api/doctor/prescriptions`             | Doctor | List prescriptions                |
| GET    | `/api/doctor/prescriptions/download`    | Doctor | Download prescription PDF         |
| GET    | `/api/doctor/ratings`                   | Doctor | View my ratings                   |

### Admin (`/api/admin`)

| Method | Endpoint                                 | Auth  | Description                        |
| ------ | ---------------------------------------- | ----- | ---------------------------------- |
| GET    | `/api/admin/users`                       | Admin | List all users                     |
| POST   | `/api/admin/users`                       | Admin | Create a user                      |
| PUT    | `/api/admin/users/:id`                   | Admin | Update user details                |
| DELETE | `/api/admin/users/:id`                   | Admin | Delete a user                      |
| PATCH  | `/api/admin/users/:id/status`            | Admin | Update user status                 |
| PATCH  | `/api/admin/users/:id/toggle-status`     | Admin | Toggle active/inactive             |
| POST   | `/api/admin/users/:id/reset-password`    | Admin | Reset user password                |
| GET    | `/api/admin/doctors/pending`             | Admin | List pending doctor approvals      |
| GET    | `/api/admin/appointments`                | Admin | List all appointments              |
| POST   | `/api/admin/appointments/:id/meeting`    | Admin | Create meeting link                |
| GET    | `/api/admin/stats`                       | Admin | Dashboard statistics               |
| POST   | `/api/admin/reports/generate`            | Admin | Generate report (PDF/CSV/Excel)    |
| GET    | `/api/admin/emergencies`                 | Admin | List emergencies                   |
| GET    | `/api/admin/emergencies/:id`             | Admin | Get emergency by ID                |
| PATCH  | `/api/admin/emergencies/:id/status`      | Admin | Update emergency status            |
| GET    | `/api/admin/emergencies/:id/nearest-hospital` | Admin | Find nearest hospital        |

### Emergency (`/api/emergency`)

| Method | Endpoint                                  | Auth | Description                    |
| ------ | ----------------------------------------- | ---- | ------------------------------ |
| POST   | `/api/emergency`                          | No   | Create emergency case          |
| GET    | `/api/emergency`                          | No   | List all emergencies           |
| GET    | `/api/emergency/:id`                      | No   | Get emergency by ID            |
| PATCH  | `/api/emergency/:id/status`               | No   | Update emergency status        |
| GET    | `/api/emergency/:id/nearest-hospital`     | No   | Find nearest hospital          |

### Hospitals (`/api/hospitals`)

| Method | Endpoint              | Auth  | Description              |
| ------ | --------------------- | ----- | ------------------------ |
| GET    | `/api/hospitals`      | No    | List all hospitals       |
| GET    | `/api/hospitals/:id`  | No    | Get hospital by ID       |
| POST   | `/api/hospitals`      | Admin | Create hospital          |
| DELETE | `/api/hospitals/:id`  | Admin | Delete hospital          |

### Documents (`/api/documents`)

| Method | Endpoint                         | Auth    | Description               |
| ------ | -------------------------------- | ------- | ------------------------- |
| POST   | `/api/documents`                 | Patient | Upload document           |
| GET    | `/api/documents`                 | Patient | List my documents         |
| DELETE | `/api/documents/:id`             | Patient | Soft-delete document      |
| DELETE | `/api/documents/:id/permanent`   | Patient | Permanently delete        |

### Users (`/api/users`)

| Method | Endpoint          | Auth | Description       |
| ------ | ----------------- | ---- | ----------------- |
| GET    | `/api/users`      | No   | List all users    |
| GET    | `/api/users/:id`  | No   | Get user by ID    |

---

## Testing

### Prerequisites

```bash
cd server
npm install   # Ensures test dependencies are installed
```

### Unit Tests

Unit tests validate individual services, controllers, validators, and middleware in isolation using Jest and mocked dependencies.

```bash
# Run unit tests only
npm run test:unit
```

**Covered modules:**
- Appointment: controller, service, validator, rating service
- Payment: controller, service, validator, receipt PDF service
- Middleware: auth, error handler, request validation

### Integration Tests

Integration tests verify end-to-end API behavior using Supertest with an in-memory MongoDB instance (`mongodb-memory-server`).

```bash
# Run integration tests only
npm run test:integration
```

**Covered modules:**
- Appointment CRUD & status transitions
- Appointment rating system
- Chat message history & access control
- Payment creation, verification & receipt generation

### Run All Tests

```bash
npm test
```

**Current status: 190 tests passing across 16 test suites.**

### Doctor Dashboard Module

| Command                           | Description                                       |
| --------------------------------- | ------------------------------------------------- |
| `npm run test:doctor`             | Run all doctor tests (unit + integration)         |
| `npm run test:doctor:unit`        | Doctor unit tests only (service + controller)     |
| `npm run test:doctor:integration` | Doctor integration tests only (API endpoints)     |
| `npm run test:doctor:perf`        | Artillery.io performance / load test              |
| `npm run test:doctor:perf:report` | Performance test with JSON report generation      |

> **Note:** For performance tests, the server must be running (`npm run dev`) and you need to replace `<DOCTOR_JWT_TOKEN>` in `tests/artillery/doctor-load-test.yml` with a valid JWT.

### Test Summary (Doctor Dashboard)

| Type                 | Tests        | Framework                            |
| -------------------- | ------------ | ------------------------------------ |
| Unit – Service       | 39           | Jest + MongoMemoryServer             |
| Unit – Controller    | 24           | Jest (mocked service layer)          |
| Integration – API    | 35           | Jest + Supertest + MongoMemoryServer |
| Performance          | 12 scenarios | Artillery.io (4 load phases)         |
| **Total**            | **98**       |                                      |

**Test coverage includes:** appointment controller/service/validator, payment controller/service/validator, auth middleware, error handler, chat integration, doctor dashboard (profile, availability, appointments, patients, medical records, prescriptions, ratings, analytics, meetings, account management), and Artillery load testing.

### Performance Testing

Performance tests use [Artillery.io](https://artillery.io) to evaluate API response times under load.

```bash
# Install Artillery globally (if not already)
npm install -g artillery

# Start the server first
npm run dev

# Generate fresh JWT tokens for authenticated testing
node -e "
  require('dotenv').config();
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: '<PATIENT_USER_ID>', role: 'patient' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );
  console.log(token);
"

# Set tokens as environment variables and run load test
ARTILLERY_PATIENT_TOKEN="<patient_jwt>" \
ARTILLERY_DOCTOR_TOKEN="<doctor_jwt>" \
artillery run tests/artillery/load-test.yml
```

**Load test configuration** (`tests/artillery/load-test.yml`):

| Phase     | Duration | Arrival Rate | Description                     |
| --------- | -------- | ------------ | ------------------------------- |
| Warm up   | 30s      | 5 req/s      | Baseline load                   |
| Ramp up   | 60s      | 20 req/s     | Stress test with increased load |
| Cool down | 30s      | 5 req/s      | Recovery phase                  |

**Tested scenarios (15 weighted scenarios):**

| Category              | Scenarios                                      | Auth         |
| --------------------- | ---------------------------------------------- | ------------ |
| Public                | List users, List doctors, List hospitals       | No           |
| Patient: Appointments | List, Stats, Create & Cancel, Filter by status | JWT (patient)|
| Patient: Chat         | Message history, Unread count, Inbox           | JWT (patient)|
| Patient: Payments     | Get payment by appointment                     | JWT (patient)|
| Doctor                | List appointments, Dashboard, List patients    | JWT (doctor) |

### Test Environment Configuration

- Tests use `mongodb-memory-server` — no external database required
- JWT secrets are set inline within test files
- Email service is mocked in tests (no real emails sent)
- Cloudinary is mocked for upload tests
- All tests run with `npx jest` (configured in `package.json`)

---

## Deployment

### Backend Deployment (Render)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add all environment variables from `server/.env.example` in the Render dashboard
5. Set `CLIENT_URL` to your deployed frontend URL
6. Set `NODE_ENV` to `production`

### Frontend Deployment (Vercel)

1. Import your repository on [Vercel](https://vercel.com)
2. Configure:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variables:
   - `VITE_API_URL` = your deployed backend URL (e.g. `https://careline360-api.onrender.com/api`)
   - `VITE_GROQ_API_KEY` = your Groq API key

### Environment Variables (Production)

> Never expose secret values. Use your hosting platform's environment variable settings.

**Required for backend:**
`PORT`, `MONGO_URI`, `NODE_ENV`, `CLIENT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `GEMINI_API_KEY`

**Optional for backend:**
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SMSLENZ_USER_ID`, `SMSLENZ_API_KEY`

**Required for frontend:**
`VITE_API_URL`, `VITE_GROQ_API_KEY`

---

## Contributors

> **SLIIT** | Year 3 Semester 2 — Application Frameworks Module
> **Group ID:** Y3S2-SE-80

| Name          | Student ID | Component                       |
| ------------- | ---------- | ------------------------------- |
| K. Vanayalini | IT23193840 | Emergency & Hospital Management |
| T. Thuvarekan | IT23281332 | Doctor Management               |
| B. Clarin     | IT23402584 | Admin Dashboard                 |
| G. Shajana    | IT23164208 | Appointment & Consultation      |

---

## License

This project is licensed under the [MIT License](LICENSE).
