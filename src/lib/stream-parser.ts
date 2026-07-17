/**
 * Parses an SSE or plain-text stream from a Response body.
 * Yields individual tokens as they arrive.
 */
export async function* parseChatStream(
  response: Response,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    // Check Content-Type header to see if it's a stream
    const contentType = response.headers.get("Content-Type") || "";
    const isSSE = contentType.includes("text/event-stream");

    while (true) {
      if (signal?.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      
      // If it is not SSE, yield raw text chunks directly to support plain text streaming
      if (!isSSE && !chunk.trim().startsWith("data:")) {
        yield chunk;
        continue;
      }

      // SSE parsing with buffer
      buffer += chunk;
      
      // SSE events are separated by double newlines (\n\n or \r\n\r\n)
      // but individual lines can be separated by a single newline.
      // We will split the buffer by newlines to process line-by-line.
      const lines = buffer.split(/\r?\n/);
      
      // The last line may be incomplete (e.g. mid-data payload), keep it in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Skip SSE comment lines
        if (trimmed.startsWith(":")) {
          continue;
        }

        // Process data lines
        if (trimmed.startsWith("data:")) {
          const dataContent = trimmed.substring(5).trim();

          // Stop signal
          if (dataContent === "[DONE]") {
            return;
          }

          // Try parsing JSON payloads
          try {
            const parsed = JSON.parse(dataContent);
            
            // Extract tokens using supported fields
            const token =
              parsed.token ??
              parsed.content ??
              parsed.text ??
              parsed.delta ??
              parsed.choices?.[0]?.delta?.content ??
              parsed.choices?.[0]?.text ??
              "";

            if (typeof token === "string" && token) {
              yield token;
            } else if (typeof token === "object" && token !== null) {
              // Handle nested delta properties if present (e.g. { content: "..." })
              const subToken = token.content ?? token.text ?? "";
              if (subToken) yield subToken;
            }
          } catch {
            // If the payload is not JSON, treat the text after "data:" as the token itself
            yield dataContent;
          }
        }
      }
    }

    // Process any remaining contents in the buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data:")) {
        const dataContent = trimmed.substring(5).trim();
        if (dataContent !== "[DONE]") {
          try {
            const parsed = JSON.parse(dataContent);
            const token =
              parsed.token ??
              parsed.content ??
              parsed.text ??
              parsed.delta ??
              "";
            if (typeof token === "string" && token) {
              yield token;
            }
          } catch {
            yield dataContent;
          }
        }
      } else if (!trimmed.startsWith(":") && !isSSE) {
        yield trimmed;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
