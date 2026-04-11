import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import ChatBubble from "./ChatBubble";

export default function ChatWindow({ messages, currentUserId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 dark:bg-white/[0.02]" style={{ minHeight: 0 }}>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-10">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-[#0d9488]" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No messages yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Start the conversation!</p>
        </div>
      )}
      {messages.map((msg, i) => (
        <ChatBubble
          key={msg._id || `msg-${i}`}
          message={msg}
          isOwn={String(msg.senderId?._id || msg.senderId || msg.sender?._id || msg.sender) === String(currentUserId)}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
