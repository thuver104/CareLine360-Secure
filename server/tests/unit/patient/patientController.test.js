/**
 * Patient Controller - Unit Tests
 * V2 Mass Assignment security tests for createEmergency().
 *
 * Confirmed vulnerability (BEFORE fix): the controller spread the entire
 * req.body into emergencyService.createEmergency(), only overriding
 * `patient`. This allowed an authenticated patient to inject
 * status/responderName/resolvedAt/responseTime at creation time.
 *
 * Fix: explicitly allowlist description/latitude/longitude from req.body;
 * patient identity always comes from req.user.userId, never req.body.
 */

jest.mock("../../../services/emergencyService", () => ({
  createEmergency: jest.fn(),
}));

const emergencyService = require("../../../services/emergencyService");
const { createEmergency } = require("../../../controllers/patientController");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("patientController - createEmergency (V2 Mass Assignment)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("normal creation with description/latitude/longitude succeeds", async () => {
    const req = {
      user: { userId: "patient123" },
      body: {
        description: "Chest pain",
        latitude: 6.9271,
        longitude: 79.8612,
      },
    };
    const res = mockRes();
    const next = jest.fn();

    const mockEmergency = { _id: "e1", status: "PENDING" };
    emergencyService.createEmergency.mockResolvedValue(mockEmergency);

    await createEmergency(req, res, next);

    expect(emergencyService.createEmergency).toHaveBeenCalledWith({
      description: "Chest pain",
      latitude: 6.9271,
      longitude: 79.8612,
      patient: "patient123",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockEmergency });
  });

  test("attacker-supplied status is not forwarded to the service", async () => {
    const req = {
      user: { userId: "patient123" },
      body: {
        description: "Fake emergency",
        latitude: 6.9271,
        longitude: 79.8612,
        status: "RESOLVED",
      },
    };
    const res = mockRes();
    const next = jest.fn();

    emergencyService.createEmergency.mockResolvedValue({ _id: "e1" });

    await createEmergency(req, res, next);

    const forwardedData = emergencyService.createEmergency.mock.calls[0][0];
    expect(forwardedData).not.toHaveProperty("status");
    expect(forwardedData).toEqual({
      description: "Fake emergency",
      latitude: 6.9271,
      longitude: 79.8612,
      patient: "patient123",
    });
  });

  test("attacker-supplied responderName is not forwarded to the service", async () => {
    const req = {
      user: { userId: "patient123" },
      body: {
        description: "Fake emergency",
        latitude: 6.9271,
        longitude: 79.8612,
        responderName: "Injected Responder",
      },
    };
    const res = mockRes();
    const next = jest.fn();

    emergencyService.createEmergency.mockResolvedValue({ _id: "e1" });

    await createEmergency(req, res, next);

    const forwardedData = emergencyService.createEmergency.mock.calls[0][0];
    expect(forwardedData).not.toHaveProperty("responderName");
  });

  test("attacker-supplied resolvedAt is not forwarded to the service", async () => {
    const req = {
      user: { userId: "patient123" },
      body: {
        description: "Fake emergency",
        latitude: 6.9271,
        longitude: 79.8612,
        resolvedAt: "2020-01-01T00:00:00.000Z",
      },
    };
    const res = mockRes();
    const next = jest.fn();

    emergencyService.createEmergency.mockResolvedValue({ _id: "e1" });

    await createEmergency(req, res, next);

    const forwardedData = emergencyService.createEmergency.mock.calls[0][0];
    expect(forwardedData).not.toHaveProperty("resolvedAt");
  });

  test("attacker-supplied responseTime is not forwarded to the service", async () => {
    const req = {
      user: { userId: "patient123" },
      body: {
        description: "Fake emergency",
        latitude: 6.9271,
        longitude: 79.8612,
        responseTime: 0,
      },
    };
    const res = mockRes();
    const next = jest.fn();

    emergencyService.createEmergency.mockResolvedValue({ _id: "e1" });

    await createEmergency(req, res, next);

    const forwardedData = emergencyService.createEmergency.mock.calls[0][0];
    expect(forwardedData).not.toHaveProperty("responseTime");
  });

  test("attacker-supplied triggeredAt is not forwarded to the service", async () => {
    const req = {
      user: { userId: "patient123" },
      body: {
        description: "Fake emergency",
        latitude: 6.9271,
        longitude: 79.8612,
        triggeredAt: "2020-01-01T00:00:00.000Z",
      },
    };
    const res = mockRes();
    const next = jest.fn();

    emergencyService.createEmergency.mockResolvedValue({ _id: "e1" });

    await createEmergency(req, res, next);

    const forwardedData = emergencyService.createEmergency.mock.calls[0][0];
    expect(forwardedData).not.toHaveProperty("triggeredAt");
  });

  test("patient always comes from req.user.userId, even if req.body has a different patient value", async () => {
    const req = {
      user: { userId: "realPatient123" },
      body: {
        description: "Fake emergency",
        latitude: 6.9271,
        longitude: 79.8612,
        patient: "attackerSuppliedPatientId",
      },
    };
    const res = mockRes();
    const next = jest.fn();

    emergencyService.createEmergency.mockResolvedValue({ _id: "e1" });

    await createEmergency(req, res, next);

    const forwardedData = emergencyService.createEmergency.mock.calls[0][0];
    expect(forwardedData.patient).toBe("realPatient123");
    expect(forwardedData.patient).not.toBe("attackerSuppliedPatientId");
  });

  test("unknown/unallowed fields are stripped and never forwarded to the service", async () => {
    const req = {
      user: { userId: "patient123" },
      body: {
        description: "Fake emergency",
        latitude: 6.9271,
        longitude: 79.8612,
        isAdmin: true,
        role: "admin",
        __proto__: { polluted: true },
        randomField: "should not pass through",
      },
    };
    const res = mockRes();
    const next = jest.fn();

    emergencyService.createEmergency.mockResolvedValue({ _id: "e1" });

    await createEmergency(req, res, next);

    const forwardedData = emergencyService.createEmergency.mock.calls[0][0];
    expect(Object.keys(forwardedData).sort()).toEqual(
      ["description", "latitude", "longitude", "patient"].sort()
    );
  });

  test("forwards errors via next", async () => {
    const req = {
      user: { userId: "patient123" },
      body: { description: "x", latitude: 1, longitude: 1 },
    };
    const res = mockRes();
    const next = jest.fn();
    const error = new Error("DB failure");

    emergencyService.createEmergency.mockRejectedValue(error);

    await createEmergency(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
