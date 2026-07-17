# Ứng Dụng AI Chat Streaming (Next.js 15 App Router)

Ứng dụng AI Chat Streaming hoàn chỉnh, đạt chất lượng production-ready, được tối ưu hóa hiệu năng hiển thị và giao diện trực quan. Dự án được thiết kế để nộp bài test kỹ thuật Senior Frontend Engineer.

---

## 1. Tính Năng Chính

* **Hội Thoại Thời Gian Thực (Streaming):** Hiển thị câu trả lời của AI tăng dần (word-by-word/token-by-token) tương tự ChatGPT/Claude.
* **Token Buffering mượt mà:** Sử dụng `requestAnimationFrame` gom buffer để tối ưu hóa render của React, tránh đơ/lag UI khi stream tốc độ cao.
* **Smart Auto-Scroll:** Tự động cuộn xuống cuối khi có tin nhắn mới hoặc đang stream. Nếu người dùng chủ động cuộn lên trên để đọc lại thông tin cũ, hệ thống sẽ ngắt auto-scroll và hiển thị nút "Tin nhắn mới ở dưới" để người dùng click quay lại cuối trang.
* **Stop Generation (Hủy stream):** Hủy request và ngắt dòng dữ liệu stream tức thì bằng cách tích hợp `AbortController`.
* **Copy Response chuyên nghiệp:** Sao chép nội dung phản hồi của Assistant chỉ với 1 click, hiển thị trạng thái "Copied" trong 1.5 giây.
* **Error Handling & Retry:** Hiển thị thông báo lỗi mạng/kết nối thân thiện trực tiếp trên bong bóng tin nhắn. Hỗ trợ nút **Thử lại (Retry)** để tái gửi prompt trước đó và tái tạo câu trả lời của AI.
* **Accessibility (A11y) & IME Composition:**
  * Xử lý bộ gõ tiếng Việt Telex/VNI (Composition events) tránh việc nhấn Enter gửi tin nhắn sớm khi đang gõ dấu tiếng Việt.
  * Tích hợp đầy đủ thuộc tính `aria-label`, `aria-live="polite"` cho loading states, và `role="alert"` cho các thông báo lỗi.
* **Responsive Design:** Giao diện tối giản, hiện đại, tương thích hoàn toàn trên Desktop và Mobile.

---

## 2. Công Nghệ Sử Dụng

* **Core:** Next.js 15 (App Router), React 19, TypeScript (Strict mode)
* **Styling:** Tailwind CSS (v4)
* **Icons:** Lucide React
* **Không sử dụng thư viện UI chat có sẵn** để đảm bảo khả năng tối ưu hóa sâu nhất.

---

## 3. Cài Đặt Và Chạy Thử

### Yêu cầu hệ thống
* Node.js v18.18.0 hoặc mới hơn (Khuyên dùng Node.js v20+)

### Các bước khởi chạy

1. **Cài đặt các dependency:**
   ```bash
   npm install
   ```

2. **Cấu hình Biến Môi Trường:**
   Sao chép tệp cấu hình mẫu và tùy chỉnh (mặc định sẽ chạy với Mock API nội bộ):
   ```bash
   cp .env.example .env
   ```

3. **Chạy ở chế độ Development:**
   ```bash
   npm run dev
   ```
   Mở trình duyệt truy cập vào [http://localhost:3000](http://localhost:3000).

4. **Kiểm tra ESLint / Linter:**
   ```bash
   npm run lint
   ```

5. **Build cho Production:**
   ```bash
   npm run build
   ```

---

## 4. Đặc Tả API Streaming

Hệ thống giao tiếp với backend thông qua giao thức HTTP POST và nhận về dữ liệu dạng Stream.

### Endpoint cấu hình
Biến môi trường: `NEXT_PUBLIC_CHAT_API_URL` (Mặc định: `/api/chat`)

### Định dạng Request
```http
POST /api/chat
Content-Type: application/json
```
Body:
```json
{
  "message": "Nội dung câu hỏi của người dùng"
}
```

### Định dạng Response
Hỗ trợ cả 2 định dạng phản hồi:

1. **Dạng A: Server-Sent Events (SSE)**
   Các sự kiện cách nhau bởi dòng trống, dữ liệu bắt đầu bằng tiền tố `data:`.
   ```text
   data: {"token":"Xin"}

   data: {"token":" chào"}

   data: {"token":" bạn"}

   data: [DONE]
   ```
   *Lưu ý:* Parser hỗ trợ giải mã cả các payload chứa một trong các trường: `token`, `content`, `text`, `delta`. Nếu payload không phải là JSON hợp lệ, parser sẽ tự động lấy toàn bộ nội dung phía sau `data:` làm token text.

2. **Dạng B: Plain Text Stream**
   Trả về chuỗi văn bản thuần túy nối đuôi nhau liên tục.
   ```text
   Xin chào bạn...
   ```

---

## 5. Giải Thích Cơ Chế Kỹ Thuật

### A. Token Buffering bằng `requestAnimationFrame` (RAF)
Khi backend gửi token với tần suất cực cao (ví dụ: vài micro-second mỗi token), nếu ta cập nhật React state trực tiếp cho mỗi token nhận được, trình duyệt sẽ bị quá tải do re-render liên tục gây giật, lag UI.
* **Giải pháp:** Khi có token mới, ta đưa nó vào một biến ref buffer tạm thời (`tokenBufferRef`). Một vòng lặp sử dụng `requestAnimationFrame` hoạt động ở tần suất tối ưu của màn hình (~60Hz) sẽ định kỳ lấy toàn bộ text từ buffer và cập nhật vào React state một lần.
* **Dọn dẹp bộ nhớ:** Khi quá trình streaming kết thúc hoặc component unmount, vòng lặp RAF và `AbortController` sẽ được hủy bỏ triệt để, ngăn chặn rò rỉ bộ nhớ (memory leaks).

### B. Intelligent Auto-Scroll
Cơ chế tự động cuộn được tinh chỉnh tỉ mỉ:
* **Tự động cuộn:** Chỉ kích hoạt khi khoảng cách từ thanh cuộn hiện tại tới đáy nhỏ hơn `150px` (người dùng đang xem nội dung mới nhất).
* **Ngắt cuộn thông minh:** Nếu người dùng chủ động cuộn lên trên quá `150px` để đọc lịch sử, flag `isAtBottomRef` sẽ đổi thành `false`. Lúc này, dòng text mới tiếp tục render nhưng màn hình giữ nguyên vị trí để không gây khó chịu cho người dùng. Nút "Tin nhắn mới ở dưới" sẽ hiển thị.
* **Cuộn bắt buộc:** Khi gửi một prompt mới hoặc click nút Retry, màn hình sẽ bắt buộc cuộn mượt xuống đáy.

### C. Stop Generation bằng `AbortController`
* Mỗi lượt gọi API chat sẽ khởi tạo một `AbortController` mới.
* Tín hiệu `abortController.signal` được truyền trực tiếp vào hàm `fetch`.
* Khi người dùng nhấn nút **Stop** (Dừng sinh), hàm `abortController.abort()` được gọi, lập tức chấm dứt HTTP connection và giải phóng tài nguyên mạng. Bong bóng chat chuyển trạng thái thành `stopped`.

---

## 6. Xử Lý Các Trường Hợp Lỗi (Edge Cases)

1. **Lỗi mạng đột ngột:** Bong bóng của Assistant chuyển sang trạng thái `error`, hiển thị viền đỏ kèm thông báo chi tiết, đồng thời hiển thị nút **Thử lại (Retry)**.
2. **Ký tự lạ hoặc Dữ liệu SSE bị vỡ chunk:** Bộ đệm dòng (`buffer`) của `stream-parser.ts` sẽ giữ lại phần dữ liệu chưa hoàn chỉnh và chỉ xử lý khi nhận đủ dòng kết thúc bằng ký tự xuống dòng.
3. **Thoát trang khi đang stream:** Component hook hủy request bằng `AbortController` và hủy animation frame trong cleanup function của `useEffect` để tránh ghi đè state trên component đã unmount.
4. **Giả lập lỗi:** Để kiểm thử luồng lỗi và tính năng Retry, hãy nhập prompt là `lỗi kết nối`. Hệ thống sẽ trả về lỗi 500 từ mock API để bạn kiểm tra giao diện.


