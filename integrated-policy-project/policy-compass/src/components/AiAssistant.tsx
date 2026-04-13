import { useState, useRef, useEffect } from "react";
import { X, Minimize2, Maximize2, Globe, Mic, Paperclip, Send, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import avatarImg from "@/assets/ai-assistant-avatar.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // Mock assistant response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "感谢您的提问，我正在为您查询相关政策信息，请稍候..." },
      ]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden border-2 border-primary bg-primary/10"
      >
        <img src={avatarImg} alt="智能助手" className="w-full h-full object-cover contrast-125 saturate-150 brightness-90" />
      </button>
    );
  }

  const dialogSize = maximized
    ? "fixed inset-4 z-50"
    : "fixed bottom-6 right-6 z-50 w-[420px] h-[600px]";

  return (
    <div className={`${dialogSize} flex flex-col rounded-xl shadow-2xl overflow-hidden border border-border bg-background`}>
      {/* Header */}
      <div className="h-12 bg-primary flex items-center justify-between px-4 shrink-0">
        <span className="text-sm font-bold text-primary-foreground tracking-wide">智能助手</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMaximized(!maximized)}
            className="p-1.5 rounded hover:bg-primary-foreground/10 text-primary-foreground transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMaximized(false)}
            className="p-1.5 rounded hover:bg-primary-foreground/10 text-primary-foreground transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setOpen(false); setMaximized(false); }}
            className="p-1.5 rounded hover:bg-primary-foreground/10 text-primary-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Inbox className="h-16 w-16 mb-3 text-muted-foreground/40" />
            <p className="text-sm">暂无消息，快来问我吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <img src={avatarImg} alt="" className="w-8 h-8 rounded-full mr-2 shrink-0 mt-0.5" />
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-3 border-t border-primary/20 bg-accent/30">
        <div className="rounded-lg border border-primary/30 bg-background p-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="您好，请输入问题，Shift+Enter 换行"
            className="border-none shadow-none resize-none text-sm min-h-[40px] max-h-[80px] p-0 focus-visible:ring-0"
            rows={1}
          />
          <div className="flex items-center justify-between mt-2">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs rounded-full h-7 px-3">
              <Globe className="h-3.5 w-3.5" />
              联网搜索
            </Button>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
                <Mic className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
                <Paperclip className="h-4 w-4" />
              </button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7 px-3 rounded-full"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="h-3.5 w-3.5" />
                发送
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
