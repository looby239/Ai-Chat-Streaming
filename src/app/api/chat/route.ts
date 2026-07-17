import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const encoder = new TextEncoder();

function encodeSse(data: unknown) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;

    if (!apiKey || !model) {
      return NextResponse.json(
        {
          error:
            "Máy chủ chưa được cấu hình OPENAI_API_KEY và OPENAI_MODEL.",
        },
        { status: 503 }
      );
    }

    const abortController = new AbortController();
    let streamClosed = false;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Flush an initial SSE comment before waiting for OpenAI. This prevents
        // deployment gateways from terminating the function for a slow TTFB.
        controller.enqueue(encoder.encode(": connected\n\n"));

        try {
          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                reasoning_effort: "minimal",
                max_completion_tokens: 2048,
                messages: [{ role: "user", content: message.trim() }],
                stream: true,
              }),
              signal: abortController.signal,
            }
          );

          if (!response.ok) {
            const details = await response.text();
            throw new Error(
              `Lỗi kết nối OpenAI: ${response.status} - ${details}`
            );
          }

          if (!response.body) {
            throw new Error("OpenAI không trả về nội dung stream.");
          }

          const reader = response.body.getReader();

          while (!streamClosed) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }

          if (!streamClosed) controller.close();
        } catch (error: unknown) {
          if (streamClosed) return;

          const errorMessage =
            error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi khi kết nối OpenAI.";

          controller.enqueue(encodeSse({ error: errorMessage }));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
      cancel() {
        streamClosed = true;
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Đã xảy ra lỗi máy chủ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
