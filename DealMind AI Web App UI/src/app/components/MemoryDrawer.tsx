import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { type Memory, type MemoryStats } from "../api";

type MemoryFilter = "all" | "experience" | "world" | "opinion";

interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recalledMemoryIds: Set<string>;
  memories: Memory[];
  memoryStats: MemoryStats;
}

const getTypeConfig = (type: string, content: string) => {
  const isPlaybook = type === "opinion" && content.toLowerCase().includes("meta-strategy");
  if (isPlaybook) return { label: "Playbook", color: "#F87171" };
  const configs: Record<string, { label: string; color: string }> = {
    experience: { label: "Experience", color: "#8B5CF6" },
    world: { label: "Fact", color: "#10B981" },
    opinion: { label: "Insight", color: "#F59E0B" },
  };
  return configs[type] || { label: type, color: "#6B7280" };
};

export function MemoryDrawer({ isOpen, onClose, recalledMemoryIds, memories, memoryStats }: MemoryDrawerProps) {
  const [activeTab, setActiveTab] = useState<MemoryFilter>("all");

  const filteredMemories = activeTab === "all"
    ? memories
    : memories.filter((m) => m.memory_type === activeTab);

  const tabs: { key: MemoryFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "experience", label: "Experience" },
    { key: "world", label: "Facts" },
    { key: "opinion", label: "Insights" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 340 }}
            animate={{ x: 0 }}
            exit={{ x: 340 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 bottom-0 flex flex-col overflow-hidden z-50"
            style={{
              width: "340px",
              backgroundColor: "#1C1C1E",
              borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
              boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
              <div className="flex items-center gap-2">
                <h2 style={{ fontSize: "15px", color: "#F5F5F5", fontWeight: 600 }}>Memory Bank</h2>
                <span
                  className="px-2 py-0.5 rounded"
                  style={{ fontSize: "11px", backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#8B5CF6", fontWeight: 500 }}
                >
                  {memoryStats.total}
                </span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: "#8A8A8E" }}>
                <X size={18} />
              </button>
            </div>

            {/* Stats row */}
            <div className="px-4 py-2 flex gap-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {[
                { label: "Experiences", value: memoryStats.by_type?.experience || 0, color: "#8B5CF6" },
                { label: "Facts", value: memoryStats.by_type?.world || 0, color: "#10B981" },
                { label: "Insights", value: memoryStats.by_type?.opinion || 0, color: "#F59E0B" },
              ].map((s) => (
                <div key={s.label} className="flex-1 text-center">
                  <div style={{ fontSize: "16px", fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "9px", color: "#6B7280" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="px-4 py-3 border-b flex gap-2 overflow-x-auto" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-3 py-1.5 rounded transition-all whitespace-nowrap"
                  style={{
                    fontSize: "12px",
                    backgroundColor: activeTab === tab.key ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    color: activeTab === tab.key ? "#8B5CF6" : "#8A8A8E",
                    fontWeight: activeTab === tab.key ? 500 : 400,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Memory Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredMemories.length === 0 && (
                <p style={{ fontSize: "12px", color: "#6B7280", textAlign: "center", paddingTop: "20px" }}>
                  No {activeTab !== "all" ? activeTab : ""} memories yet
                </p>
              )}
              {filteredMemories.map((memory) => {
                const config = getTypeConfig(memory.memory_type, memory.content);
                const isRecalled = recalledMemoryIds.has(memory.id);

                return (
                  <motion.div
                    key={memory.id}
                    animate={{
                      backgroundColor: isRecalled
                        ? ["rgba(99, 102, 241, 0.2)", "rgba(255, 255, 255, 0.04)"]
                        : "rgba(255, 255, 255, 0.04)",
                    }}
                    transition={{ duration: 0.8 }}
                    className="p-3 rounded-lg relative"
                    style={{ border: "1px solid rgba(255, 255, 255, 0.06)" }}
                  >
                    {/* Type Dot */}
                    <div className="absolute left-3 top-3.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />

                    {/* Content */}
                    <div className="pl-4">
                      <p className="mb-2" style={{ fontSize: "13px", color: "#F5F5F5", lineHeight: "1.5" }}>
                        {memory.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: "10px", color: config.color, fontWeight: 500 }}>{config.label}</span>
                        <span style={{ fontSize: "10px", color: "#6B7280" }}>
                          {new Date(memory.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
