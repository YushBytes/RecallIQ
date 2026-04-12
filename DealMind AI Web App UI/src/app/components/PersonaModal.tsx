import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Lightbulb, Globe, TrendingUp, MessageSquare } from "lucide-react";
import { type Memory } from "../api";

interface PersonaModalProps {
  onClose: () => void;
  memories: Memory[];
  totalMemories: number;
}

export function PersonaModal({ onClose, memories, totalMemories }: PersonaModalProps) {
  const [personaEntries, setPersonaEntries] = useState<any[]>([]);

  useEffect(() => {
    // Filter to opinion and world fact memories, oldest first
    const relevant = [...memories]
      .filter((m) => m.memory_type === "opinion" || m.memory_type === "world")
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 12);

    setPersonaEntries(relevant);
  }, [memories]);

  const getEntryConfig = (mem: Memory) => {
    if (mem.memory_type === "opinion") {
      const isPlaybook = mem.content.toLowerCase().includes("meta-strategy");
      return {
        Icon: isPlaybook ? TrendingUp : Lightbulb,
        type: isPlaybook ? "Playbook" : "Insight / belief",
        color: isPlaybook ? "#F59E0B" : "#8B5CF6",
      };
    }
    return { Icon: Globe, type: "World fact", color: "#10B981" };
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
        className="w-full max-w-3xl rounded-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#1C1C1E", border: "1px solid rgba(255, 255, 255, 0.06)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#F5F5F5" }}>Agent's Evolving Persona</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-all" style={{ color: "#8A8A8E" }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "#8A8A8E", marginBottom: "24px" }}>
          Based on {totalMemories} accumulated memories, here's how my understanding evolved
        </p>

        {personaEntries.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#6B7280", fontSize: "14px" }}>
            <MessageSquare size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p>No persona insights yet — have a few conversations first!</p>
          </div>
        )}

        {/* Timeline */}
        <div className="relative pl-12">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-px" style={{ backgroundColor: "rgba(255, 255, 255, 0.06)" }} />

          {/* Timeline Entries */}
          <div className="space-y-5">
            {personaEntries.map((mem, index) => {
              const { Icon, type, color } = getEntryConfig(mem);
              const time = new Date(mem.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              });
              return (
                <motion.div
                  key={mem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  className="relative"
                >
                  {/* Icon Circle */}
                  <div
                    className="absolute -left-12 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
                  >
                    <Icon size={14} style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className="p-4 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: "11px", color, fontWeight: 600 }}>{type}</span>
                      <span style={{ fontSize: "11px", color: "#6B7280" }}>{time}</span>
                    </div>
                    <p style={{ fontSize: "14px", color: "#F5F5F5", lineHeight: "1.6" }}>{mem.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
