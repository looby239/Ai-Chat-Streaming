"use client";

import React, { useCallback } from "react";
import { useChatStream } from "@/hooks/useChatStream";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";

export const ChatScreen: React.FC = () => {
  // 1. Initialize AutoScroll hook
  const {
    scrollContainerRef,
    bottomRef,
    showScrollButton,
    scrollToBottom,
    scrollIfAtBottom,
  } = useAutoScroll();

  // 2. Callback for real-time streaming updates.
  // Reads DOM scroll position directly — no stale ref, no race condition.
  const handleStreamUpdate = useCallback(() => {
    scrollIfAtBottom();
  }, [scrollIfAtBottom]);

  // 3. Initialize ChatStream hook
  const {
    messages,
    isGenerating,
    sendMessage,
    stopGeneration,
    retryMessage,
    clearChat,
  } = useChatStream(handleStreamUpdate);

  // 4. Send handler — always force-scroll to bottom on new message
  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text);
      setTimeout(() => {
        scrollToBottom("auto");
      }, 50);
    },
    [sendMessage, scrollToBottom]
  );

  // 5. Prompt suggestion click handler
  const handleSelectPrompt = useCallback(
    (prompt: string) => {
      handleSend(prompt);
    },
    [handleSend]
  );

  // 6. Retry handler
  const handleRetry = useCallback(
    (id: string) => {
      retryMessage(id);
      setTimeout(() => {
        scrollToBottom("auto");
      }, 50);
    },
    [retryMessage, scrollToBottom]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-950 transition-colors duration-200">
      {/* Top Header */}
      <ChatHeader onClear={clearChat} hasMessages={hasMessages} />

      {/* Message Area */}
      <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden bg-gray-50/20 dark:bg-gray-900/10">
        <MessageList
          messages={messages}
          onRetry={handleRetry}
          onSelectPrompt={handleSelectPrompt}
          scrollContainerRef={scrollContainerRef}
          bottomRef={bottomRef}
          showScrollButton={showScrollButton}
          scrollToBottom={scrollToBottom}
          isGenerating={isGenerating}
        />
      </div>

      {/* Input Composer */}
      <ChatComposer
        onSend={handleSend}
        onStop={stopGeneration}
        isGenerating={isGenerating}
      />
    </div>
  );
};
export default ChatScreen;
