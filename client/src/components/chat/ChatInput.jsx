import { useState } from "react";

export default function ChatInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const handleChange = (e) => {
    setText(e.target.value);
    // Trigger typing indicator
    if (onTyping) {
      onTyping();
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex space-x-2 p-4 bg-white border-t border-gray-100"
      >
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}
