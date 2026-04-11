import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useUser } from "../context/UserContext";
import { getMessages } from "../api/chatApi";
import { getAppointmentById } from "../api/appointmentApi";
import useSocket from "../hooks/useSocket";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import { displayName } from "../utils/displayName";
import { getInitials } from "../utils/colors";

export default function ChatPage() {
  const { id } = useParams();
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const socket = useSocket();
  const myUserId = localStorage.getItem("userId");

  // Fetch appointment info for header
  useEffect(() => {
    getAppointmentById(id)
      .then((res) => setAppointment(res.data.data))
      .catch(() => {});
  }, [id]);

  // Join room and fetch initial messages
  useEffect(() => {
    socket.emit("join_room", { appointmentId: id });

    getMessages(id)
      .then((res) => {
        setMessages(res.data.messages || res.data.data || []);
      })
      .catch((err) => console.error("Failed to fetch messages:", err));

    return () => {
      socket.emit("leave_room", { appointmentId: id });
    };
  }, [id, currentUser, socket]);

  // Listen for new messages from socket
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("new_message", handleNewMessage);
    return () => socket.off("new_message", handleNewMessage);
  }, [id, currentUser, socket]);

  const handleSend = (text) => {
    if (!currentUser) return;
    socket.emit("send_message", {
      appointmentId: id,
      message: text,
    });
  };

  const otherPerson = appointment
    ? currentUser?.role === "patient" ? appointment.doctor : appointment.patient
    : null;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to={`/appointments/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[#0d9488] dark:hover:text-teal-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Appointment
        </Link>
      </div>

      {/* Chat container */}
      <div className="glass-card rounded-2xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)" }}>

        {/* Chat header */}
        <div className="bg-gradient-to-r from-[#0d9488] to-[#0891b2] px-5 py-3.5 flex items-center gap-3 shrink-0">
          {otherPerson ? (
            <>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                {getInitials(displayName(otherPerson))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {currentUser?.role === "patient" ? `Dr. ${displayName(otherPerson)}` : displayName(otherPerson)}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white/60">Online</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-white">Consultation Chat</p>
            </div>
          )}
        </div>

        {/* Online bar */}
        <div className="px-4 py-1.5 bg-white dark:bg-[var(--glass-bg)] border-b border-gray-100 dark:border-white/5">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">Messages are real-time via Socket.io</span>
        </div>

        {/* Messages */}
        <ChatWindow messages={messages} currentUserId={myUserId} />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={!currentUser} />
      </div>
    </div>
  );
}
