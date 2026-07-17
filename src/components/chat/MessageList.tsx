import React from "react";
import { ChatMessage } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import EmptyState from "./EmptyState";
import { ArrowDown, Bot } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  onRetry: (id: string) => void;
  onSelectPrompt: (prompt: string) => void;
  scrollContainerRef: React.RefCallback<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  isGenerating: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onRetry,
  onSelectPrompt,
  scrollContainerRef,
  bottomRef,
  showScrollButton,
  scrollToBottom,
  isGenerating,
}) => {
  if (messages.length === 0) {
    return <EmptyState onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0 w-full">
      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-6 py-6 space-y-2"
      >
        <div className="max-w-3xl mx-auto flex flex-col divide-y divide-gray-100/50 dark:divide-gray-800/30">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onRetry={onRetry} />
          ))}
        </div>
        {/* Anchor element to mark the bottom */}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          aria-label="Cuộn xuống cuối trang"
          className={
            isGenerating
              ? "absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 z-10 select-none bg-blue-600 hover:bg-blue-700 text-white border border-blue-500"
              : "absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 z-10 select-none bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80"
          }
        >
          {isGenerating ? (
            <>
              {/* Typing dots */}
              <Bot className="w-3.5 h-3.5" />
              <span>AI đang gõ...</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4 animate-bounce" />
              <span>Cuộn xuống</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
export default MessageList;
