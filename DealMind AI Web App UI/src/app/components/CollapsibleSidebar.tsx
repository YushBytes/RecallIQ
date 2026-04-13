import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart3, Brain, Settings, FileText } from "lucide-react";
import { type Deal, type PipelineStats, getObjections } from "../api";

interface CollapsibleSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  onMemoryClick: () => void;
  onDealClick: (deal: Deal) => void;
  onSettingsClick: () => void;
  deals: Deal[];
  pipelineStats: PipelineStats;
}

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    prospecting: "#60A5FA",
    qualification: "#60A5FA",
    discovery: "#F59E0B",
    proposal: "#8B5CF6",
    negotiation: "#10B981",
    closed_won: "#34D399",
    closed_lost: "#F87171",
  };
  return colors[stage.toLowerCase()] || "#6B7280";
};

export function CollapsibleSidebar({
  isExpanded, onToggle, onMemoryClick, onDealClick, onSettingsClick, deals, pipelineStats,
}: CollapsibleSidebarProps) {
  const [hoveredDeal, setHoveredDeal] = useState<string | null>(null);

  return (
    <>
      {/* Icon Rail - Always Visible */}
      <motion.div
        className="h-full flex flex-col items-center py-4 border-r"
        style={{
          width: "56px",
          backgroundColor: "#1C1C1E",
          borderColor: "rgba(255, 255, 255, 0.06)",
          position: "relative",
          zIndex: 45, // Above everything including the overlay and modal backdrops
        }}
      >
        <button
          onClick={onToggle}
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-all hover:bg-white/5"
          style={{ color: isExpanded ? "#6366F1" : "#8A8A8E" }}
          title="Pipeline"
        >
          <BarChart3 size={20} />
        </button>
        <button
          onClick={onMemoryClick}
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-6 transition-all hover:bg-white/5"
          style={{ color: "#8A8A8E" }}
          title="Memory Bank"
        >
          <Brain size={20} />
        </button>
        <div className="h-px w-6 mb-6" style={{ backgroundColor: "rgba(255, 255, 255, 0.06)" }} />
        <button
          onClick={onSettingsClick}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
          style={{ color: "#8A8A8E" }}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </motion.div>

      {/* Expanded Panel - Slides Over */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[35]"
              onClick={onToggle}
            />

            {/* Expanded Sidebar Panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed left-[56px] top-0 bottom-0 flex flex-col overflow-hidden z-[40]"
              style={{
                width: "280px",
                backgroundColor: "#1C1C1E",
                borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "4px 0 24px rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* Header */}
              <div className="p-4 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
                <h2 style={{ fontSize: "15px", color: "#F5F5F5", fontWeight: 600 }}>Deal Pipeline</h2>
                <div className="flex gap-2 mt-2">
                  {[
                    { label: "Deals", value: pipelineStats.total_deals },
                    { label: "Pipeline", value: `$${((pipelineStats.total_pipeline_value || 0) / 1000).toFixed(0)}K` },
                    { label: "Avg Win", value: `${pipelineStats.average_win_probability || 0}%` },
                  ].map((stat) => (
                    <div key={stat.label} className="flex-1 p-1.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: "10px", color: "#6B7280" }}>{stat.label}</div>
                      <div style={{ fontSize: "13px", color: "#E5E7EB", fontWeight: 600 }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deal Cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {deals.length === 0 && (
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>No deals yet. Seed data should load on startup.</p>
                )}
                {deals.map((deal) => {
                  const objections = getObjections(deal);
                  return (
                    <motion.div
                      key={deal.id}
                      onMouseEnter={() => setHoveredDeal(deal.id)}
                      onMouseLeave={() => setHoveredDeal(null)}
                      className="p-3 rounded-lg cursor-pointer transition-all"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      {/* One-line summary */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStageColor(deal.stage) }} />
                        <span style={{ fontSize: "13px", color: "#F5F5F5", fontWeight: 500 }}>{deal.client_name}</span>
                        <span style={{ fontSize: "13px", color: "#8A8A8E" }}>·</span>
                        <span style={{ fontSize: "13px", color: "#8A8A8E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.company}</span>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <span style={{ fontSize: "13px", color: "#F5F5F5", fontWeight: 600 }}>
                          ${(deal.deal_value || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: "13px", color: "#8A8A8E" }}>·</span>
                        <span style={{ fontSize: "12px", color: "#8A8A8E" }}>{deal.stage}</span>
                      </div>

                      {objections.length > 0 && (
                        <div className="ml-4 mt-1">
                          <span style={{ fontSize: "11px", color: "#F59E0B" }}>
                            ⚠️ {objections.length} objection{objections.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {/* Hover Actions */}
                      <AnimatePresence>
                        {hoveredDeal === deal.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 mt-3 pt-2 border-t"
                            style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
                          >
                            <button
                              onClick={() => onDealClick(deal)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-all hover:bg-white/5 w-full justify-center"
                              style={{ color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.25)" }}
                            >
                              <FileText size={12} />
                              📋 Strategic Dossier
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
