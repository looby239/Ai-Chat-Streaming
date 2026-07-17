import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, MessageStatus } from "@/types/chat";
import { sendChatMessage } from "@/lib/chat-api";
import { parseChatStream } from "@/lib/stream-parser";

export function useChatStream(onStreamUpdate?: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Refs for tracking state without causing re-renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const tokenBufferRef = useRef<string>("");
  const activeMessageIdRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isStreamingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Keep track of component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cleanup on unmount
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Flush accumulated tokens to React state
  const flushBuffer = useCallback(() => {
    const textToAppend = tokenBufferRef.current;
    const msgId = activeMessageIdRef.current;

    if (!textToAppend || !msgId || !isMountedRef.current) return;

    tokenBufferRef.current = "";

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          const nextStatus: MessageStatus =
            msg.status === "pending" ? "streaming" : msg.status;
          return {
            ...msg,
            status: nextStatus,
            content: msg.content + textToAppend,
          };
        }
        return msg;
      })
    );

    // Call callback to trigger auto-scroll
    if (onStreamUpdate) {
      onStreamUpdate();
    }
  }, [onStreamUpdate]);

  // requestAnimationFrame loop to periodically flush the buffer
  const startRafLoop = useCallback(() => {
    isStreamingRef.current = true;

    const tick = () => {
      if (!isStreamingRef.current || !isMountedRef.current) return;

      flushBuffer();
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [flushBuffer]);

  const stopRafLoop = useCallback(() => {
    isStreamingRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    // Flush any leftover tokens in buffer
    flushBuffer();
  }, [flushBuffer]);

  // Update status for the active message
  const updateMessageStatus = useCallback(
    (id: string, status: MessageStatus, error?: string) => {
      if (!isMountedRef.current) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === id) {
            return {
              ...msg,
              status,
              ...(error ? { error } : {}),
            };
          }
          return msg;
        })
      );
    },
    []
  );

  // Send message implementation
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || isGenerating) return;

      setIsGenerating(true);

      // 1. Add user message
      const userMessageId = Math.random().toString(36).substring(7);
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: "user",
        content: trimmedText,
        status: "completed",
        createdAt: Date.now(),
      };

      // 2. Add assistant pending placeholder
      const assistantMessageId = Math.random().toString(36).substring(7);
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        status: "pending",
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      activeMessageIdRef.current = assistantMessageId;
      tokenBufferRef.current = "";

      // Trigger scroll immediately when new message is added
      if (onStreamUpdate) {
        setTimeout(onStreamUpdate, 50);
      }

      // Initialize AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        startRafLoop();

        const response = await sendChatMessage(trimmedText, abortController.signal);
        
        const stream = parseChatStream(response, abortController.signal);

        for await (const token of stream) {
          tokenBufferRef.current += token;
        }

        // Successfully stream completed
        stopRafLoop();
        updateMessageStatus(assistantMessageId, "completed");
      } catch (err: unknown) {
        stopRafLoop();

        if (err instanceof DOMException && err.name === "AbortError") {
          updateMessageStatus(assistantMessageId, "stopped");
        } else {
          const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
          updateMessageStatus(assistantMessageId, "error", errorMsg);
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
        activeMessageIdRef.current = null;
      }
    },
    [isGenerating, startRafLoop, stopRafLoop, updateMessageStatus, onStreamUpdate]
  );

  // Stop current generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Retry logic for a specific failed assistant message
  const retryMessage = useCallback(
    async (messageId: string) => {
      if (isGenerating) return;

      // Find the message index
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // The user message is typically the one right before the failed assistant message
      const userMessage = messages[messageIndex - 1];
      if (!userMessage || userMessage.role !== "user") return;

      setIsGenerating(true);

      // Re-initialize this assistant message state
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: "",
              status: "pending",
              error: undefined,
            };
          }
          return msg;
        })
      );

      activeMessageIdRef.current = messageId;
      tokenBufferRef.current = "";

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        startRafLoop();

        const response = await sendChatMessage(userMessage.content, abortController.signal);
        const stream = parseChatStream(response, abortController.signal);

        for await (const token of stream) {
          tokenBufferRef.current += token;
        }

        stopRafLoop();
        updateMessageStatus(messageId, "completed");
      } catch (err: unknown) {
        stopRafLoop();

        if (err instanceof DOMException && err.name === "AbortError") {
          updateMessageStatus(messageId, "stopped");
        } else {
          const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
          updateMessageStatus(messageId, "error", errorMsg);
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
        activeMessageIdRef.current = null;
      }
    },
    [messages, isGenerating, startRafLoop, stopRafLoop, updateMessageStatus]
  );

  // Clear chat logs
  const clearChat = useCallback(() => {
    stopGeneration();
    setMessages([]);
  }, [stopGeneration]);

  return {
    messages,
    isGenerating,
    sendMessage,
    stopGeneration,
    retryMessage,
    clearChat,
  };
}
