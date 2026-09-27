const request = require("supertest");
const express = require("express");

const validateRequest = require("../../middleware/validateRequest");

const {
    getAppointmentsRules,
    getAppointmentByIdRules,
    createAppointmentRules,
    statusTransitionRules,
} = require("../../validators/appointmentValidator");

const app = express();

app.use(express.json());

// Test routes
app.get(
    "/appointments",
    getAppointmentsRules,
    validateRequest,
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Valid appointment query",
        });
    }
);

app.get(
    "/appointments/:id",
    getAppointmentByIdRules,
    validateRequest,
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Valid appointment ID",
        });
    }
);

app.post(
    "/appointments",
    createAppointmentRules,
    validateRequest,
    (req, res) => {
        res.status(201).json({
            success: true,
            message: "Valid appointment data",
        });
    }
);

app.patch(
    "/appointments/:id/status",
    statusTransitionRules,
    validateRequest,
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Valid status transition",
        });
    }
);
// V9 Security Tests

describe("V9 - Improper Input Validation", () => {

    // Invalid MongoDB ID
    describe("MongoDB ID validation", () => {

        test("should reject an invalid appointment MongoDB ID", async () => {
            const response = await request(app)
                .get("/appointments/abc");

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Invalid mongo Id");
        });

        test("should accept a valid appointment MongoDB ID", async () => {
            const response = await request(app)
                .get("/appointments/507f1f77bcf86cd799439011");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

    });
    // Invalid appointment status

    describe("Appointment status validation", () => {

        test("should reject an invalid appointment status", async () => {
            const response = await request(app)
                .get("/appointments")
                .query({
                    status: "INVALID_STATUS",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain(
                "Invalid appointment status"
            );
        });

        test("should accept a valid appointment status", async () => {
            const response = await request(app)
                .get("/appointments")
                .query({
                    status: "pending",
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test("should reject multiple values when one status is invalid", async () => {
            const response = await request(app)
                .get("/appointments")
                .query({
                    status: "pending,INVALID_STATUS",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

    });
    // Invalid appointment creation
    describe("Appointment input validation", () => {

        const validAppointment = {
            doctor: "507f1f77bcf86cd799439011",
            date: "2099-12-31",
            time: "09:30",
            consultationType: "video",
            symptoms: "Headache",
            notes: "Test appointment",
            priority: "medium",
        };

        test("should reject an invalid doctor ID", async () => {
            const response = await request(app)
                .post("/appointments")
                .send({
                    ...validAppointment,
                    doctor: "abc",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Invalid doctor ID");
        });

        test("should reject an invalid time", async () => {
            const response = await request(app)
                .post("/appointments")
                .send({
                    ...validAppointment,
                    time: "99:99",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain(
                "Time must be in HH:mm format"
            );
        });

        test("should reject an invalid consultation type", async () => {
            const response = await request(app)
                .post("/appointments")
                .send({
                    ...validAppointment,
                    consultationType: "hacking",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain(
                "Invalid consultation type"
            );
        });

        test("should reject an invalid priority", async () => {
            const response = await request(app)
                .post("/appointments")
                .send({
                    ...validAppointment,
                    priority: "invalid",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain(
                "Invalid priority"
            );
        });

        test("should accept valid appointment data", async () => {
            const response = await request(app)
                .post("/appointments")
                .send(validAppointment);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

    });

    // Status transition validation

    describe("Status transition validation", () => {

        test("should reject an invalid status transition", async () => {
            const response = await request(app)
                .patch(
                    "/appointments/507f1f77bcf86cd799439011/status"
                )
                .send({
                    status: "INVALID_STATUS",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain(
                "Invalid status"
            );
        });

        test("should accept a valid status transition", async () => {
            const response = await request(app)
                .patch(
                    "/appointments/507f1f77bcf86cd799439011/status"
                )
                .send({
                    status: "confirmed",
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

    });

});