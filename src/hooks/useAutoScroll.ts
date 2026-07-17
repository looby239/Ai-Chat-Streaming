import { useRef, useState, useCallback } from "react";

const BOTTOM_THRESHOLD = 80; // px

export function useAutoScroll() {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const getDistanceToBottom = useCallback((): number => {
    const el = containerRef.current;
    if (!el) return 0;
    return el.scrollHeight - el.scrollTop - el.clientHeight;
  }, []);

  const handleScroll = useCallback(() => {
    setShowScrollButton(getDistanceToBottom() > BOTTOM_THRESHOLD);
  }, [getDistanceToBottom]);

  // Callback ref — fires immediately whenever the DOM node mounts or unmounts.
  // This avoids the stale-ref problem: useEffect fires too late (after first render
  // when the container was null), so the scroll listener was never attached.
  const scrollContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Cleanup old listener
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", handleScroll);
      }
      containerRef.current = node;
      if (node) {
        node.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // run once to set initial state
      }
    },
    [handleScroll]
  );

  // Used by RAF streaming loop — reads DOM directly, no stale ref
  const scrollIfAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (getDistanceToBottom() <= BOTTOM_THRESHOLD) {
      el.scrollTop = el.scrollHeight; // instant, no animation — smooth stream feel
    }
  }, [getDistanceToBottom]);

  // Force-scroll (e.g. when user sends a message)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowScrollButton(false);
  }, []);

  return {
    scrollContainerRef,
    bottomRef,
    showScrollButton,
    scrollToBottom,
    scrollIfAtBottom,
  };
}
