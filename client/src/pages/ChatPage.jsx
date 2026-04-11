import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useUser } from "../context/UserContext";
import { getMessages, markAsRead } from "../api/chatApi";
import useSocket from "../hooks/useSocket";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";

export default function ChatPage() {
  const { id } = useParams();
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const socket = useSocket();

  // Join room and fetch initial messages
  useEffect(() => {
    socket.emit("joinRoom", id);

    getMessages(id)
      .then((res) => {
        setMessages(res.data.data);
        if (currentUser) {
          markAsRead(id, currentUser._id).catch(() => {});
        }
      })
      .catch((err) => console.error("Failed to fetch messages:", err));
  }, [id, currentUser, socket]);

  // Listen for new messages from socket
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      if (currentUser) {
        markAsRead(id, currentUser._id).catch(() => {});
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [id, currentUser, socket]);

  const handleSend = (text) => {
    if (!currentUser) return;
    socket.emit("sendMessage", {
      appointment: id,
      sender: currentUser._id,
      message: text,
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consultation Chat</h1>
        <Link to={`/appointments/${id}`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#0d9488] dark:hover:text-teal-400 flex items-center space-x-1 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Appointment</span>
        </Link>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
        <ChatWindow messages={messages} currentUserId={currentUser?._id} />
        <ChatInput onSend={handleSend} disabled={!currentUser} />
      </div>
    </div>
  );
}
