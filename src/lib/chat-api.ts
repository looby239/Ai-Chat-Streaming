/**
 * Sends a chat message to the streaming API endpoint.
 * Returns the raw Response object which can be parsed chunk-by-chunk.
 */
export async function sendChatMessage(
  message: string,
  signal?: AbortSignal
): Promise<Response> {
  const apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL || "/api/chat";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok) {
    // Attempt to extract error message if available, otherwise fallback
    let errorMsg = `HTTP error! status: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error || data?.message) {
        errorMsg = data.error || data.message;
      }
    } catch {
      // Ignore JSON parse error and use status string
    }
    throw new Error(errorMsg);
  }

  return response;
}
