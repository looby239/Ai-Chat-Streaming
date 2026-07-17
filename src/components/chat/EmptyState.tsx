import React from "react";
import { Sparkles, Code, Compass, Mail } from "lucide-react";

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    icon: Compass,
    title: "Lên kế hoạch du lịch",
    desc: "Gợi ý lịch trình du lịch Đà Lạt 3 ngày 2 đêm tự túc",
    prompt: "Gợi ý lịch trình du lịch Đà Lạt 3 ngày 2 đêm tự túc chi tiết và tiết kiệm.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: Code,
    title: "Lập trình & Thuật toán",
    desc: "Viết hàm debounce trong JavaScript và giải thích cách hoạt động",
    prompt: "Viết giúp mình một hàm debounce bằng TypeScript/JavaScript tối ưu nhất và giải thích ngắn gọn cách hoạt động của nó.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: Sparkles,
    title: "Giải thích kiến thức",
    desc: "Giải thích điện toán lượng tử (Quantum Computing) cho học sinh cấp 3",
    prompt: "Hãy giải thích khái niệm điện toán lượng tử một cách cực kỳ đơn giản, trực quan giống như đang giảng cho học sinh cấp 3 hiểu.",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    icon: Mail,
    title: "Viết email chuyên nghiệp",
    desc: "Viết email xin nghỉ phép bằng tiếng Anh lịch sự",
    prompt: "Viết giúp mình một email xin nghỉ phép ngắn hạn bằng tiếng Anh chuyên nghiệp, lịch sự để gửi cho sếp người nước ngoài.",
    color: "text-amber-500 bg-amber-500/10",
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto my-auto px-4 py-12 text-center select-none">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/10">
          <Sparkles className="w-8 h-8" />
        </div>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white">
        Trợ lý AI Chat Streaming
      </h1>
      <p className="mt-3 text-base text-gray-500 dark:text-gray-400 max-w-md">
        Bắt đầu cuộc trò chuyện bằng cách nhập nội dung hoặc chọn một trong các câu hỏi chủ đề mẫu dưới đây.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-10">
        {SUGGESTIONS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group flex flex-col items-start p-4 text-left rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 hover:border-blue-500 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <div className={`p-2 rounded-lg ${item.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default EmptyState;
