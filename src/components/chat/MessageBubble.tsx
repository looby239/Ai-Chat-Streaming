import React, { useState } from "react";
import { ChatMessage } from "@/types/chat";
import { Copy, Check, RotateCcw, AlertCircle, Bot, User } from "lucide-react";
import StreamingCursor from "./StreamingCursor";

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (id: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const { role, content, status, error } = message;
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Could not copy text: ", err);
    }
  };

  const renderInlineFormatting = (text: string) => {
    // Format inline code blocks `code`
    const inlineParts = text.split(/(`[^`\n]+`)/g);
    return inlineParts.map((part, index) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-gray-155 dark:bg-gray-800 font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Format bold text **bold**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((subPart, subIndex) => {
        if (subPart.startsWith("**") && subPart.endsWith("**")) {
          return (
            <strong key={`${index}-${subIndex}`} className="font-bold text-gray-900 dark:text-white">
              {subPart.slice(2, -2)}
            </strong>
          );
        }
        return subPart;
      });
    });
  };

  const renderTable = (
    rows: string[][],
    aligns: ("left" | "center" | "right" | null)[],
    keyIndex: number
  ) => {
    if (rows.length === 0) return null;

    const headers = rows[0];
    const bodyRows = rows.slice(1);

    return (
      <div
        key={`table-${keyIndex}`}
        className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950"
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {headers.map((header, idx) => {
                const align = aligns[idx] || "left";
                let alignClass = "text-left";
                if (align === "center") alignClass = "text-center";
                if (align === "right") alignClass = "text-right";

                return (
                  <th
                    key={idx}
                    scope="col"
                    className={`px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 ${alignClass}`}
                  >
                    {renderInlineFormatting(header)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 dark:divide-gray-800/60">
            {bodyRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/10 transition-colors">
                {row.map((cell, cellIdx) => {
                  const align = aligns[cellIdx] || "left";
                  let alignClass = "text-left";
                  if (align === "center") alignClass = "text-center";
                  if (align === "right") alignClass = "text-right";

                  return (
                    <td
                      key={cellIdx}
                      className={`px-4 py-2.5 text-gray-600 dark:text-gray-400 ${alignClass}`}
                    >
                      {renderInlineFormatting(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const parseTablesAndText = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let alignSettings: ("left" | "center" | "right" | null)[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const isTableRow = trimmed.startsWith("|") && trimmed.endsWith("|");

      if (isTableRow) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
          alignSettings = [];
        }

        const cells = line
          .split("|")
          .map((c) => c.trim())
          .slice(1, -1);

        const isSeparator = cells.every((cell) => /^:?-+:?$/.test(cell));

        if (isSeparator) {
          alignSettings = cells.map((cell) => {
            const starts = cell.startsWith(":");
            const ends = cell.endsWith(":");
            if (starts && ends) return "center";
            if (ends) return "right";
            if (starts) return "left";
            return null;
          });
        } else {
          tableRows.push(cells);
        }
      } else {
        if (inTable) {
          elements.push(renderTable(tableRows, alignSettings, elements.length));
          inTable = false;
          tableRows = [];
          alignSettings = [];
        }

        // Check if line is a header: starts with 1 to 6 '#' followed by a space
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const headerText = headerMatch[2];
          const headingClasses = [
            "",
            "text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-white first:mt-0",
            "text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-white first:mt-0",
            "text-lg font-bold mt-3 mb-1 text-gray-850 dark:text-gray-200 first:mt-0",
            "text-base font-bold mt-3 mb-1 text-gray-800 dark:text-gray-200 first:mt-0",
            "text-sm font-bold mt-2 mb-1 text-gray-700 dark:text-gray-300 first:mt-0",
            "text-xs font-bold mt-2 mb-1 text-gray-600 dark:text-gray-400 first:mt-0",
          ][level] || "text-base font-bold";

          const HeadingTag = `h${level}` as any;

          elements.push(
            <HeadingTag key={`h-${i}`} className={headingClasses}>
              {renderInlineFormatting(headerText)}
            </HeadingTag>
          );
          continue;
        }

        elements.push(
          <div key={`txt-${i}`} className="min-h-[1.25rem] whitespace-pre-wrap break-words leading-relaxed">
            {renderInlineFormatting(line)}
          </div>
        );
      }
    }

    if (inTable) {
      elements.push(renderTable(tableRows, alignSettings, elements.length));
    }

    return elements;
  };

  const renderContent = (text: string) => {
    if (!text && status === "pending") {
      return (
        <div className="flex items-center space-x-1.5 py-1 text-gray-400 dark:text-gray-500" aria-live="polite">
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
        </div>
      );
    }

    // Split text by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Check if it's a code block
      if (part.startsWith("```") && part.endsWith("```")) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : "";
        const code = match ? match[2] : part.slice(3, -3);

        return (
          <div
            key={index}
            className="my-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 font-mono text-sm shadow-sm bg-gray-50 dark:bg-gray-950"
          >
            {language && (
              <div className="flex justify-between items-center px-4 py-1.5 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 font-sans select-none">
                <span>{language}</span>
              </div>
            )}
            <pre className="p-4 overflow-x-auto text-gray-800 dark:text-gray-200 whitespace-pre">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Parse tables and paragraphs for non-code block segments
      return <React.Fragment key={index}>{parseTablesAndText(part)}</React.Fragment>;
    });
  };

  return (
    <div className={`flex w-full group gap-4 py-4 px-4 ${isUser ? "" : "bg-gray-50/50 dark:bg-gray-900/10 border-y border-gray-100/50 dark:border-gray-900/20"}`}>
      {/* Avatar Container */}
      <div className="flex-shrink-0">
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isUser ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"}`}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Author Title */}
        <span className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1 select-none">
          {isUser ? "Bạn" : "Trợ lý AI"}
        </span>

        {/* Message Content */}
        <div className="text-gray-800 dark:text-gray-200 text-sm sm:text-base">
          {renderContent(content)}
          {status === "streaming" && <StreamingCursor />}
        </div>

        {/* Error Warning display */}
        {status === "error" && (
          <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/50 text-red-700 dark:text-red-400" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <span className="font-semibold">Lỗi kết nối:</span> {error || "Không thể kết nối đến máy chủ."}
            </div>
          </div>
        )}

        {/* Action Controls for Assistant Bubble */}
        {!isUser && status !== "pending" && (
          <div className="flex items-center gap-2 mt-2 select-none">
            {/* Copy response */}
            {content && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                aria-label="Sao chép câu trả lời"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}

            {/* Retry failed responses */}
            {status === "error" && onRetry && (
              <button
                onClick={() => onRetry(message.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                aria-label="Thử lại câu trả lời"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default MessageBubble;
