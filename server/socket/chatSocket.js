const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { sendMessage } = require("../services/chatService");

/*
 * V4 FIX - Socket.IO Missing Authorization
 *
 * Previously any authenticated socket could call join_room / typing /
 * stop_typing with ANY appointmentId and the server obeyed. The REST
 * endpoint GET /api/chat/:appointmentId checked ownership, but the real-time
 * channel did not, so an attacker could silently receive another patient's
 * live consultation messages and inject events into their room.
 *
 * Controls added:
 *   1. Deny-by-default room authorization (DB check: only the assigned
 *      patient/doctor may join).
 *   2. Typing events relayed only for rooms this socket was authorized for.
 *   3. Strict payload + ObjectId validation (no crash on malformed events,
 *      no NoSQL-operator objects reaching the database).
 *   4. Server-owned room names ("appointment:<id>").
 *   5. Role and isActive reloaded from the DB at connect time.
 */

const CHAT_ROLES = new Set(["doctor", "patient"]);
const ROOM_DENIED_MESSAGE = "Not authorized to join this chat";

const roomName = (appointmentId) => `appointment:${appointmentId}`;

const isValidAppointmentId = (value) =>
  typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);

const readPayload = (payload) =>
  payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload
    : {};

const replyAck = (ack, body) => {
  if (typeof ack === "function") ack(body);
};

/** Deny by default: true only for the patient or doctor on the appointment. */
const isAppointmentParticipant = async ({ appointmentId, userId, role }) => {
  if (!CHAT_ROLES.has(role) || !isValidAppointmentId(appointmentId)) {
    return false;
  }
  const appointment = await Appointment.findById(appointmentId)
    .select("patient doctor")
    .lean();
  if (!appointment) return false;

  const uid = String(userId);
  if (role === "doctor") return String(appointment.doctor) === uid;
  return String(appointment.patient) === uid;
};

/** Authenticate via JWT, then load CURRENT account state from the DB. */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      console.error("❌ Socket auth failed: No token provided in handshake");
      return next(new Error("Authentication error: no token"));
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      console.error("❌ Critical: JWT_ACCESS_SECRET not set in environment");
      return next(
        new Error("Server configuration error: JWT_ACCESS_SECRET not set"),
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      console.error("❌ JWT verification failed:", jwtErr.message);
      if (jwtErr.name === "TokenExpiredError") {
        return next(new Error("Authentication error: token expired"));
      }
      return next(new Error(`Authentication error: ${jwtErr.message}`));
    }

    if (!decoded.userId || !mongoose.isValidObjectId(decoded.userId)) {
      console.error("❌ Token missing/invalid userId property");
      return next(new Error("Authentication error: invalid token structure"));
    }

    // V4: trust the database, not stale token claims.
    const user = await User.findById(decoded.userId)
      .select("role isActive")
      .lean();
    if (!user || user.isActive === false) {
      console.warn(
        `[SECURITY] Socket rejected for missing/deactivated account userId=${decoded.userId}`,
      );
      return next(new Error("Authentication error: account not permitted"));
    }

    socket.user = { userId: String(user._id), role: user.role };
    socket.data.authorizedRooms = new Set();
    console.log(
      "✅ Socket authenticated - userId:",
      socket.user.userId,
      "role:",
      socket.user.role,
    );
    next();
  } catch (err) {
    console.error("❌ Socket auth error:", err.message);
    next(new Error("Authentication error: invalid token"));
  }
};

const registerSocketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { userId, role } = socket.user;
    console.log(
      `🔌 Socket connected: userId=${userId} role=${role} socketId=${socket.id}`,
    );

    const isAuthorizedForRoom = (appointmentId) =>
      isValidAppointmentId(appointmentId) &&
      socket.data.authorizedRooms.has(appointmentId) &&
      socket.rooms.has(roomName(appointmentId));

    const denyRoom = (appointmentId, reason, ack) => {
      console.warn(
        `[SECURITY] join_room denied: ${role}:${userId} appointmentId=${JSON.stringify(appointmentId)} reason=${reason} socketId=${socket.id}`,
      );
      const body = { ok: false, message: ROOM_DENIED_MESSAGE };
      socket.emit("room_error", body);
      replyAck(ack, body);
    };

    socket.on("join_room", async (payload, ack) => {
      const { appointmentId } = readPayload(payload);

      if (!isValidAppointmentId(appointmentId)) {
        return denyRoom(appointmentId, "invalid_id", ack);
      }

      try {
        const allowed = await isAppointmentParticipant({
          appointmentId,
          userId,
          role,
        });
        if (!allowed) return denyRoom(appointmentId, "not_participant", ack);

        socket.data.authorizedRooms.add(appointmentId);
        socket.join(roomName(appointmentId));
        console.log(
          `📥 Server: ${role}:${userId} joined room ${appointmentId}, socketId=${socket.id}`,
        );
        socket.emit("room_joined", { appointmentId });
        replyAck(ack, { ok: true, appointmentId });
      } catch (err) {
        console.error("❌ Server: join_room error:", err.message);
        denyRoom(appointmentId, "lookup_error", ack);
      }
    });

    socket.on("leave_room", (payload) => {
      const { appointmentId } = readPayload(payload);
      if (!isValidAppointmentId(appointmentId)) return;
      socket.leave(roomName(appointmentId));
      socket.data.authorizedRooms.delete(appointmentId);
      console.log(`🚪 Server: ${role}:${userId} left room ${appointmentId}`);
    });

    socket.on("send_message", async (payload) => {
      const { appointmentId, message } = readPayload(payload);

      if (!isValidAppointmentId(appointmentId) || typeof message !== "string") {
        return socket.emit("send_error", {
          message: "Invalid message request",
        });
      }

      try {
        // chatService.sendMessage re-checks participation against the DB.
        const result = await sendMessage({
          appointmentId,
          senderId: userId,
          senderRole: role,
          message,
        });

        if (result.status !== 201) {
          if (result.status === 403) {
            console.warn(
              `[SECURITY] send_message denied: ${role}:${userId} appointmentId=${appointmentId}`,
            );
          }
          return socket.emit("send_error", { message: result.data.message });
        }

        io.to(roomName(appointmentId)).emit("new_message", result.data.chat);
      } catch (err) {
        console.error("❌ Server: send_message error:", err.message);
        socket.emit("send_error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", (payload) => {
      const { appointmentId, isTyping } = readPayload(payload);
      if (!isAuthorizedForRoom(appointmentId)) {
        console.warn(
          `[SECURITY] typing blocked: ${role}:${userId} not authorized for ${JSON.stringify(appointmentId)}`,
        );
        return;
      }
      socket.to(roomName(appointmentId)).emit("user_typing", {
        userId,
        role,
        isTyping: !!isTyping,
        senderRole: role,
      });
    });

    socket.on("stop_typing", (payload) => {
      const { appointmentId } = readPayload(payload);
      if (!isAuthorizedForRoom(appointmentId)) return;
      socket.to(roomName(appointmentId)).emit("user_typing", {
        userId,
        role,
        isTyping: false,
        senderRole: role,
      });
    });

    socket.on("disconnect", (reason) => {
      socket.data.authorizedRooms?.clear();
      console.log(`❌ Socket disconnected: userId=${userId} reason=${reason}`);
    });
  });
};

module.exports = {
  registerSocketHandlers,
  authenticateSocket,
  isAppointmentParticipant,
  isValidAppointmentId,
  roomName,
};
