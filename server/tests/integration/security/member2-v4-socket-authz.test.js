const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { io: ioClient } = require("socket.io-client");

jest.mock("../../../models/Appointment", () => ({ findById: jest.fn() }));
jest.mock("../../../models/User", () => ({ findById: jest.fn() }));
jest.mock("../../../services/chatService", () => ({ sendMessage: jest.fn() }));

const Appointment = require("../../../models/Appointment");
const User = require("../../../models/User");
const { sendMessage } = require("../../../services/chatService");
const { registerSocketHandlers } = require("../../../socket/chatSocket");

const SECRET = "member2-v4-automated-test-secret";
const PATIENT_A = "64b000000000000000000a01";
const DOCTOR_D = "64b000000000000000000d01";
const PATIENT_B = "64b000000000000000000b01";
const INACTIVE = "64b000000000000000000c01";
const APPT_ID = "64b0000000000000000aa001";

const users = {
  [PATIENT_A]: { _id: PATIENT_A, role: "patient", isActive: true },
  [DOCTOR_D]: { _id: DOCTOR_D, role: "doctor", isActive: true },
  [PATIENT_B]: { _id: PATIENT_B, role: "patient", isActive: true },
  [INACTIVE]: { _id: INACTIVE, role: "patient", isActive: false },
};
const appointments = {
  [APPT_ID]: { _id: APPT_ID, patient: PATIENT_A, doctor: DOCTOR_D },
};

const queryOf = (doc) => {
  const q = {
    select: () => q,
    lean: async () => (doc ? { ...doc } : null),
    then: (res, rej) => Promise.resolve(doc ? { ...doc } : null).then(res, rej),
  };
  return q;
};

let httpServer;
let io;
let url;
const openSockets = [];

const tokenFor = (userId, role) =>
  jwt.sign({ userId, role }, SECRET, { expiresIn: "15m" });

const connect = (token) =>
  new Promise((resolve, reject) => {
    const s = ioClient(url, {
      auth: token ? { token } : {},
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
    });
    openSockets.push(s);
    s.once("connect", () => resolve(s));
    s.once("connect_error", (err) => reject(err));
  });

const waitFor = (socket, event, ms = 1500) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timed out waiting for "${event}"`)),
      ms,
    );
    socket.once(event, (payload) => {
      clearTimeout(t);
      resolve(payload);
    });
  });

const notReceived = (socket, event, ms = 600) =>
  new Promise((resolve) => {
    const handler = () => {
      clearTimeout(t);
      resolve(false);
    };
    const t = setTimeout(() => {
      socket.off(event, handler);
      resolve(true);
    }, ms);
    socket.once(event, handler);
  });

const firstOf = (socket, events, ms = 1500) =>
  new Promise((resolve) => {
    const handlers = {};
    const done = (name, payload) => {
      clearTimeout(t);
      events.forEach((e) => socket.off(e, handlers[e]));
      resolve({ event: name, payload });
    };
    events.forEach((e) => {
      handlers[e] = (p) => done(e, p);
      socket.once(e, handlers[e]);
    });
    const t = setTimeout(() => done("timeout", null), ms);
  });

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = SECRET;
  httpServer = http.createServer();
  io = new Server(httpServer);
  registerSocketHandlers(io);
  await new Promise((r) => httpServer.listen(0, r));
  url = `http://localhost:${httpServer.address().port}`;
});

beforeEach(() => {
  Appointment.findById.mockImplementation((id) => queryOf(appointments[id]));
  User.findById.mockImplementation((id) => queryOf(users[id]));
  sendMessage.mockImplementation(
    async ({ appointmentId, senderId, senderRole, message }) => {
      const a = appointments[appointmentId];
      const ok =
        a &&
        ((senderRole === "patient" && String(a.patient) === String(senderId)) ||
          (senderRole === "doctor" && String(a.doctor) === String(senderId)));
      if (!ok) return { status: 403, data: { message: "Access denied" } };
      return {
        status: 201,
        data: {
          message: "Message sent",
          chat: {
            _id: `msg-${Date.now()}`,
            appointmentId,
            senderId,
            senderRole,
            message,
          },
        },
      };
    },
  );
});

afterEach(() => {
  while (openSockets.length) openSockets.pop().disconnect();
});

afterAll(async () => {
  io.close();
  await new Promise((r) => httpServer.close(r));
});

describe("Member 2 - V4 Socket.IO Missing Authorization", () => {
  test("rejects a socket connection without a JWT", async () => {
    const outcome = await connect(null).then(
      () => "connected",
      (err) => err.message,
    );
    expect(outcome).toMatch(/Authentication error/);
  });

  test("appointment participant (patient) can join their own chat room", async () => {
    const victim = await connect(tokenFor(PATIENT_A, "patient"));
    victim.emit("join_room", { appointmentId: APPT_ID });
    const result = await firstOf(victim, ["room_joined", "room_error"]);
    expect(result.event).toBe("room_joined");
    expect(result.payload.appointmentId).toBe(APPT_ID);
  });

  test("authenticated non-participant is DENIED when joining another user's room", async () => {
    const attacker = await connect(tokenFor(PATIENT_B, "patient"));
    attacker.emit("join_room", { appointmentId: APPT_ID });
    const result = await firstOf(attacker, ["room_joined", "room_error"]);
    expect(result.event).toBe("room_error");
    expect(result.payload.message).toMatch(/not authorized/i);
  });

  test("non-participant does NOT receive live messages of another appointment", async () => {
    const doctor = await connect(tokenFor(DOCTOR_D, "doctor"));
    const attacker = await connect(tokenFor(PATIENT_B, "patient"));
    doctor.emit("join_room", { appointmentId: APPT_ID });
    await waitFor(doctor, "room_joined");
    attacker.emit("join_room", { appointmentId: APPT_ID });
    await firstOf(attacker, ["room_joined", "room_error"]);

    const attackerSilent = notReceived(attacker, "new_message", 800);
    doctor.emit("send_message", {
      appointmentId: APPT_ID,
      message: "Your biopsy result is ready (confidential)",
    });
    const doctorEcho = await waitFor(doctor, "new_message");
    expect(doctorEcho.message).toMatch(/biopsy/);
    expect(await attackerSilent).toBe(true);
  });

  test("non-participant cannot inject typing indicators into another user's room", async () => {
    const victim = await connect(tokenFor(PATIENT_A, "patient"));
    const attacker = await connect(tokenFor(PATIENT_B, "patient"));
    victim.emit("join_room", { appointmentId: APPT_ID });
    await waitFor(victim, "room_joined");
    const victimSilent = notReceived(victim, "user_typing", 800);
    attacker.emit("typing", { appointmentId: APPT_ID, isTyping: true });
    expect(await victimSilent).toBe(true);
  });

  test("malformed / injected appointment IDs are rejected without a DB lookup", async () => {
    const attacker = await connect(tokenFor(PATIENT_B, "patient"));
    for (const bad of [{ $ne: null }, "not-an-id", "aaaaaaaaaaaa", "", 12345]) {
      attacker.emit("join_room", { appointmentId: bad });
      const result = await firstOf(attacker, ["room_joined", "room_error"]);
      expect(result.event).toBe("room_error");
    }
    expect(Appointment.findById).not.toHaveBeenCalled();
  });

  test("malformed event payload does not crash the server", async () => {
    const attacker = await connect(tokenFor(PATIENT_B, "patient"));
    attacker.emit("join_room");
    attacker.emit("typing", null);
    await new Promise((r) => setTimeout(r, 300));
    const victim = await connect(tokenFor(PATIENT_A, "patient"));
    victim.emit("join_room", { appointmentId: APPT_ID });
    const result = await firstOf(victim, ["room_joined", "room_error"]);
    expect(result.event).toBe("room_joined");
  });

  test("deactivated account cannot open a socket even with an unexpired JWT", async () => {
    const outcome = await connect(tokenFor(INACTIVE, "patient")).then(
      () => "connected",
      (err) => err.message,
    );
    expect(outcome).toMatch(/Authentication error/);
  });

  test("legitimate doctor <-> patient chat still works after the fix", async () => {
    const victim = await connect(tokenFor(PATIENT_A, "patient"));
    const doctor = await connect(tokenFor(DOCTOR_D, "doctor"));
    victim.emit("join_room", { appointmentId: APPT_ID });
    doctor.emit("join_room", { appointmentId: APPT_ID });
    await Promise.all([
      waitFor(victim, "room_joined"),
      waitFor(doctor, "room_joined"),
    ]);

    const typingSeen = waitFor(victim, "user_typing");
    doctor.emit("typing", { appointmentId: APPT_ID, isTyping: true });
    expect((await typingSeen).isTyping).toBe(true);

    const received = waitFor(victim, "new_message");
    doctor.emit("send_message", { appointmentId: APPT_ID, message: "Hello" });
    expect((await received).message).toBe("Hello");
  });
});
