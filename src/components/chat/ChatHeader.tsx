import React from "react";
import { Trash2, Sparkles } from "lucide-react";

interface ChatHeaderProps {
  onClear: () => void;
  hasMessages: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClear, hasMessages }) => {
  return (
    <header className="w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900/60 py-4 px-6 flex items-center justify-between z-25 sticky top-0 select-none">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/10">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm tracking-tight text-gray-800 dark:text-gray-200">
          AI Streaming Chat
        </span>
      </div>

      {hasMessages && (
        <button
          onClick={onClear}
          aria-label="Xóa lịch sử cuộc trò chuyện"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa cuộc trò chuyện</span>
        </button>
      )}
    </header>
  );
};
export default ChatHeader;
