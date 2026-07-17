import React, { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";

interface ChatComposerProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({ onSend, onStop, isGenerating }) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isComposingRef = useRef(false);

  // Auto-grow textarea height on value change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${nextHeight}px`;
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSend(trimmed);
    setInput("");
    
    // Focus back on textarea after sending
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift) and NOT during active IME composition
    if (e.key === "Enter" && !e.shiftKey) {
      if (isComposingRef.current) {
        return; // Let the composition event finish
      }
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  const canSubmit = input.trim().length > 0;

  return (
    <div className="w-full bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900/60 p-4">
      <div className="max-w-3xl mx-auto relative flex items-end border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 shadow-sm focus-within:border-blue-500 dark:focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all duration-200">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={isGenerating ? "AI đang trả lời..." : "Hỏi bất cứ điều gì..."}
          disabled={isGenerating}
          rows={1}
          aria-label="Khung nhập câu hỏi cho AI"
          className="flex-1 max-h-[200px] resize-none outline-none border-0 bg-transparent py-4 pl-4 pr-16 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 min-h-[52px] leading-relaxed rounded-2xl"
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-2 select-none">
          {isGenerating ? (
            <button
              onClick={onStop}
              aria-label="Dừng sinh phản hồi"
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500/30"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSubmit}
              aria-label="Gửi câu hỏi"
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                canSubmit
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/10 hover:scale-105"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="max-w-3xl mx-auto mt-2 text-center">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 select-none">
          AI có thể đưa ra câu trả lời chưa chính xác. Hãy kiểm tra các thông tin quan trọng.
        </p>
      </div>
    </div>
  );
};
export default ChatComposer;
