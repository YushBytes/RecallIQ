import { User, MoreVertical, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface TopNavProps {
  onPersonaClick: () => void;
  onReflectClick: () => void;
  onResetClick: () => void;
  learningLabel: string;
  learningLevel: string;
}

export function TopNav({ onPersonaClick, onReflectClick, onResetClick, learningLabel, learningLevel }: TopNavProps) {
  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      cold_start: "#60A5FA",
      learning: "#F59E0B",
      proficient: "#10B981",
      expert: "#A78BFA",
    };
    return colors[level] || "#60A5FA";
  };

  const dotColor = getLevelColor(learningLevel);

  return (
    <div
      className="h-[52px] px-6 flex items-center justify-between border-b"
      style={{ borderColor: "rgba(255, 255, 255, 0.06)", backgroundColor: "#141414" }}
    >
      {/* Left - Brand */}
      <div className="flex items-center gap-3">
        <div style={{ fontSize: "20px" }}>🧠</div>
        <div className="flex items-center gap-1">
          <span style={{ fontSize: "15px", color: "#F5F5F5", fontWeight: 400 }}>DealMind</span>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 600,
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI
          </span>
        </div>
      </div>

      {/* Center - Learning Pill */}
      <motion.div
        className="px-4 py-2 rounded-full flex items-center gap-2"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          minWidth: "200px",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "13px", color: "#F5F5F5", fontWeight: 500 }}>{learningLabel}</span>
        <motion.div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Right - Icons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onReflectClick}
          className="p-2 rounded-lg transition-all hover:bg-white/5 flex items-center gap-1.5"
          style={{ color: "#8A8A8E", fontSize: "12px" }}
          title="Reflect"
        >
          <Sparkles size={16} />
          <span>Reflect</span>
        </button>
        <button
          onClick={onPersonaClick}
          className="p-2 rounded-lg transition-all hover:bg-white/5"
          style={{ color: "#8A8A8E" }}
          title="Persona Evolution"
        >
          <User size={18} />
        </button>
        <button
          onClick={onResetClick}
          className="p-2 rounded-lg transition-all hover:bg-white/5"
          style={{ color: "#8A8A8E" }}
          title="Reset Demo Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
