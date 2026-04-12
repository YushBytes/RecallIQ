import { useState } from "react";
import { motion } from "motion/react";
import { Brain } from "lucide-react";

type MemoryType = "experience" | "fact" | "insight" | "playbook";

interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  timestamp: string;
}

interface MemoryBankProps {
  recalledMemoryIds: Set<string>;
}

const mockMemories: Memory[] = [
  {
    id: "mem-1",
    type: "experience",
    content: "Sarah Chen responded well to ROI framing during pricing discussion on March 12th",
    timestamp: "2 days ago",
  },
  {
    id: "mem-2",
    type: "insight",
    content: "Enterprise deals close 40% faster when technical champion is identified early",
    timestamp: "1 week ago",
  },
  {
    id: "mem-3",
    type: "fact",
    content: "TechFlow Inc prefers quarterly payment terms over annual commitments",
    timestamp: "3 days ago",
  },
  {
    id: "mem-4",
    type: "playbook",
    content: "For budget objections: anchor with industry benchmarks, then show 3-year TCO",
    timestamp: "5 days ago",
  },
  {
    id: "mem-5",
    type: "experience",
    content: "Marcus Thompson's primary concern is implementation timeline, not pricing",
    timestamp: "1 day ago",
  },
  {
    id: "mem-6",
    type: "fact",
    content: "DataVault Systems operates on July fiscal year, budget resets in Q3",
    timestamp: "2 weeks ago",
  },
  {
    id: "mem-7",
    type: "insight",
    content: "Deals with security compliance requirements take 30% longer to close",
    timestamp: "1 week ago",
  },
];

const getTypeConfig = (type: MemoryType) => {
  const configs = {
    experience: { label: "Experience", color: "#8B5CF6", emoji: "💼" },
    fact: { label: "Fact", color: "#10B981", emoji: "📊" },
    insight: { label: "Insight", color: "#F59E0B", emoji: "💡" },
    playbook: { label: "Playbook", color: "#F87171", emoji: "📖" },
  };
  return configs[type];
};

export function MemoryBank({ recalledMemoryIds }: MemoryBankProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | MemoryType>("all");

  const filteredMemories =
    activeFilter === "all"
      ? mockMemories
      : mockMemories.filter((m) => m.type === activeFilter);

  const totalMemories = mockMemories.length;
  const experienceCount = mockMemories.filter((m) => m.type === "experience").length;
  const factCount = mockMemories.filter((m) => m.type === "fact").length;

  return (
    <div
      className="w-[320px] border-l flex flex-col overflow-hidden"
      style={{
        backgroundColor: "rgba(13, 17, 23, 0.5)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
        <h2 className="font-bold mb-3" style={{ fontSize: "15px", color: "#E5E7EB" }}>
          🧠 Memory Bank
        </h2>
        <div className="flex gap-2">
          <div
            className="flex-1 p-2 rounded-lg"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
          >
            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Total</div>
            <div style={{ fontSize: "14px", color: "#E5E7EB", fontWeight: 600 }}>
              {totalMemories}
            </div>
          </div>
          <div
            className="flex-1 p-2 rounded-lg"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
          >
            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Exp</div>
            <div style={{ fontSize: "14px", color: "#E5E7EB", fontWeight: 600 }}>
              {experienceCount}
            </div>
          </div>
          <div
            className="flex-1 p-2 rounded-lg"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
          >
            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Facts</div>
            <div style={{ fontSize: "14px", color: "#E5E7EB", fontWeight: 600 }}>
              {factCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="p-4 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all" as const, label: "All" },
            { key: "experience" as const, label: "Exp" },
            { key: "fact" as const, label: "Facts" },
            { key: "insight" as const, label: "Insights" },
            { key: "playbook" as const, label: "Playbook" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className="px-3 py-1 rounded-full transition-all"
              style={{
                fontSize: "12px",
                backgroundColor:
                  activeFilter === filter.key
                    ? "rgba(99, 102, 241, 0.2)"
                    : "rgba(255, 255, 255, 0.04)",
                color: activeFilter === filter.key ? "#8B5CF6" : "#9CA3AF",
                border: `1px solid ${
                  activeFilter === filter.key ? "#6366F1" : "rgba(255, 255, 255, 0.08)"
                }`,
                fontWeight: activeFilter === filter.key ? 600 : 400,
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMemories.map((memory, index) => {
          const config = getTypeConfig(memory.type);
          const isRecalled = recalledMemoryIds.has(memory.id);

          return (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                backgroundColor: isRecalled
                  ? ["rgba(99, 102, 241, 0.2)", "rgba(255, 255, 255, 0.04)"]
                  : "rgba(255, 255, 255, 0.04)",
              }}
              transition={{
                delay: index * 0.05,
                backgroundColor: { duration: 1.5 },
              }}
              className="p-3 rounded-lg"
              style={{
                border: `1px solid ${isRecalled ? "#6366F1" : "rgba(255, 255, 255, 0.08)"}`,
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className="px-2 py-0.5 rounded"
                  style={{
                    fontSize: "10px",
                    backgroundColor: `${config.color}20`,
                    color: config.color,
                    fontWeight: 500,
                  }}
                >
                  {config.emoji} {config.label}
                </span>
                <span style={{ fontSize: "10px", color: "#6B7280" }}>{memory.timestamp}</span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#E5E7EB",
                  lineHeight: "1.5",
                }}
              >
                {memory.content}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
