import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { apiReflect } from "../api";

interface ReflectModalProps {
  onClose: () => void;
}

export function ReflectModal({ onClose }: ReflectModalProps) {
  const [reflectionInput, setReflectionInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reflectionResult, setReflectionResult] = useState<{
    reflection: string;
    memoriesAnalyzed: number;
    totalMemories: number;
  } | null>(null);
  const [error, setError] = useState("");

  const handleReflect = async () => {
    if (!reflectionInput.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await apiReflect(reflectionInput.trim());
      setReflectionResult({
        reflection: data.reflection,
        memoriesAnalyzed: data.memories_analyzed,
        totalMemories: data.total_memories,
      });
    } catch (err: any) {
      setError(err.message || "Reflection failed. Make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-lg p-6"
        style={{ backgroundColor: "#1C1C1E", border: "1px solid rgba(255, 255, 255, 0.06)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(99, 102, 241, 0.15)" }}>
              <Sparkles size={20} style={{ color: "#6366F1" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#F5F5F5" }}>Reflect</h2>
              <p style={{ fontSize: "13px", color: "#8A8A8E" }}>Synthesize insights from your memories</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-all" style={{ color: "#8A8A8E" }}>
            <X size={20} />
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label htmlFor="reflection-input" className="block mb-2" style={{ fontSize: "13px", color: "#F5F5F5", fontWeight: 500 }}>
            What should I reflect on?
          </label>
          <input
            id="reflection-input"
            type="text"
            value={reflectionInput}
            onChange={(e) => setReflectionInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReflect()}
            placeholder="e.g., pricing objection patterns, deal trends"
            className="w-full px-4 py-3 rounded-lg border outline-none"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderColor: "rgba(255, 255, 255, 0.06)",
              color: "#F5F5F5",
              fontSize: "14px",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.06)")}
          />
        </div>

        {/* Reflect Button */}
        <button
          onClick={handleReflect}
          disabled={isLoading || !!reflectionResult || !reflectionInput.trim()}
          className="w-full py-3 rounded-lg mb-6 transition-all font-semibold flex items-center justify-center gap-2"
          style={{
            backgroundColor: isLoading || reflectionResult ? "rgba(255,255,255,0.04)" : "#6366F1",
            color: "#FFFFFF",
            fontSize: "14px",
            cursor: isLoading || reflectionResult ? "not-allowed" : "pointer",
            opacity: reflectionResult ? 0.5 : 1,
          }}
        >
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Reflecting...</> : reflectionResult ? "Reflected ✓" : "Reflect"}
        </button>

        {/* Error */}
        {error && <p style={{ color: "#F87171", fontSize: "13px", marginBottom: "12px" }}>⚠️ {error}</p>}

        {/* Result */}
        <AnimatePresence>
          {reflectionResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded" style={{ fontSize: "11px", backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6", fontWeight: 500 }}>
                  📚 {reflectionResult.memoriesAnalyzed} memories analyzed · {reflectionResult.totalMemories} total
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "#F5F5F5", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                {reflectionResult.reflection}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
