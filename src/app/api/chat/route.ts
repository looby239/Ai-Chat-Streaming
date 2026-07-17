import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Special trigger "error" to test error state and retry in frontend
    if (message.trim().toLowerCase() === "lỗi kết nối") {
      return NextResponse.json(
        { error: "Máy chủ không phản hồi! Vui lòng thử lại sau." },
        { status: 500 }
      );
    }

    // Keep credentials server-side and read the provider configuration from .env.
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;

    if (apiKey && model) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Lỗi kết nối OpenAI: ${response.status} - ${errorText}` },
          { status: response.status }
        );
      }

      // Return the OpenAI stream directly to the client.
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
    }

    // --- FALLBACK MOCK STREAM ---
    // Prepare mock text to stream back
    const text = `Xin chào! Tôi là Trợ lý AI chạy ở chế độ Client-Server Streaming. Bạn vừa hỏi tôi: "${message}".

Đây là một câu trả lời mẫu được truyền tải thông qua Server-Sent Events (SSE). Toàn bộ nội dung này đang được chia nhỏ thành các token riêng biệt và gửi trực tiếp đến trình duyệt của bạn với tần suất khoảng 20-80ms mỗi token.

Dưới đây là một ví dụ về đoạn code để bạn tham khảo:
\`\`\`typescript
// Ví dụ về cấu trúc của một token được định dạng SSE
interface SSEToken {
  token: string;
}

const sendToken = (writer: WritableStreamDefaultWriter, text: string) => {
  const payload = JSON.stringify({ token: text });
  writer.write(new TextEncoder().encode(\`data: \${payload}\\n\\n\`));
};
\`\`\`

Bạn có thể nhấn nút sao chép (Copy) ở góc dưới để lưu lại đoạn hội thoại này, hoặc nhấn Thử lại (Retry) nếu có bất kỳ lỗi nào xảy ra. Chúc bạn một ngày tốt lành!`;

    const encoder = new TextEncoder();
    let isStreamClosed = false;

    // Create readable stream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const tokens: string[] = [];
        let i = 0;
        while (i < text.length) {
          const step = Math.floor(Math.random() * 3) + 1; // random 1-3 chars
          tokens.push(text.substring(i, i + step));
          i += step;
        }

        let tokenIndex = 0;

        const sendNextToken = () => {
          if (isStreamClosed) return;

          if (tokenIndex >= tokens.length) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          const token = tokens[tokenIndex++];
          const payload = JSON.stringify({ token });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));

          const delay = Math.floor(Math.random() * 61) + 20;
          setTimeout(sendNextToken, delay);
        };

        sendNextToken();
      },
      cancel() {
        isStreamClosed = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi máy chủ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
