import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send } from "lucide-react";
import { useState } from "react";
import { type Message } from "../App";

interface ChatInterfaceProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
}

const suggestionChips = [
  "What do you know about the TechNova deal?",
  "How should I handle pricing objections?",
  "Summarize my recent deal activity",
  "What competitor intelligence do you have?",
];

export function ChatInterface({ messages, isTyping, onSendMessage }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputValue.trim() && !isTyping) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  // Simple markdown-ish formatter
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
      .replace(/\n/g, "<br>");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#141414" }}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {messages.length === 0 ? (
          /* Welcome State */
          <div className="h-full flex flex-col items-center justify-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: "64px", marginBottom: "24px" }}
            >
              🧠
            </motion.div>
            <h3
              className="mb-2 text-center"
              style={{ fontSize: "28px", fontWeight: 600, color: "#F5F5F5", lineHeight: "1.4" }}
            >
              Welcome to DealMind AI
            </h3>
            <p style={{ fontSize: "15px", color: "#8A8A8E", textAlign: "center", maxWidth: "400px" }}>
              Your memory-augmented sales companion. I remember every conversation and get smarter over time.
            </p>
          </div>
        ) : (
          /* Messages */
          <div className="space-y-6 max-w-4xl mx-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "ai" && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1"
                      style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", fontSize: "15px" }}
                    >
                      🧠
                    </div>
                  )}
                  <div className="flex flex-col" style={{ maxWidth: "72%" }}>
                    <div
                      className="px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor: message.type === "user" ? "rgba(99, 102, 241, 0.15)" : "#1C1C1E",
                        border: message.type === "user"
                          ? "1px solid rgba(99, 102, 241, 0.3)"
                          : "1px solid rgba(255, 255, 255, 0.06)",
                        color: "#F5F5F5",
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}
                      dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                    />
                    {message.type === "ai" && message.memoriesRecalled !== undefined && (
                      <div className="mt-1.5 ml-1">
                        <span style={{ fontSize: "11px", color: "#555" }}>
                          🔗 recalled {message.memoriesRecalled} memories · {message.totalMemories} total
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                    style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", fontSize: "15px" }}
                  >
                    🧠
                  </div>
                  <div
                    className="px-4 py-3 rounded-lg flex gap-1.5 items-center"
                    style={{ backgroundColor: "#1C1C1E", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "#555" }}
                        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="px-8 pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Suggestion Chips - Only show when no messages */}
          {messages.length === 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {suggestionChips.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(suggestion)}
                  className="px-3 py-2 rounded-lg text-left transition-all hover:bg-white/5"
                  style={{
                    fontSize: "12px",
                    color: "#8A8A8E",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: "#1C1C1E", border: "1px solid rgba(255, 255, 255, 0.06)" }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); handleInput(); }}
                onKeyDown={handleKeyPress}
                placeholder="Ask about deals, objections, strategy..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none"
                style={{ fontSize: "14px", color: "#F5F5F5", lineHeight: "1.6", maxHeight: "120px" }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="p-2 rounded-lg transition-all flex-shrink-0"
                style={{
                  backgroundColor: inputValue.trim() && !isTyping ? "#6366F1" : "rgba(255, 255, 255, 0.04)",
                  opacity: inputValue.trim() && !isTyping ? 1 : 0.4,
                  cursor: inputValue.trim() && !isTyping ? "pointer" : "not-allowed",
                }}
              >
                <Send size={16} style={{ color: "#FFFFFF" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
