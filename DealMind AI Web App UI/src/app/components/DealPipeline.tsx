import { motion } from "motion/react";
import { FileText } from "lucide-react";

interface Deal {
  id: string;
  clientName: string;
  company: string;
  value: string;
  stage: string;
  winProbability: number;
  objections: string[];
}

interface DealPipelineProps {
  onDealClick: (deal: Deal) => void;
}

const mockDeals: Deal[] = [
  {
    id: "1",
    clientName: "Sarah Chen",
    company: "Acme Corp",
    value: "$125,000",
    stage: "Proposal",
    winProbability: 75,
    objections: ["Pricing concern", "Timeline"],
  },
  {
    id: "2",
    clientName: "Marcus Thompson",
    company: "TechFlow Inc",
    value: "$89,000",
    stage: "Discovery",
    winProbability: 45,
    objections: ["Budget"],
  },
  {
    id: "3",
    clientName: "Emily Rodriguez",
    company: "DataVault Systems",
    value: "$210,000",
    stage: "Negotiation",
    winProbability: 85,
    objections: [],
  },
  {
    id: "4",
    clientName: "James Kim",
    company: "CloudScale",
    value: "$156,000",
    stage: "Qualification",
    winProbability: 30,
    objections: ["Decision maker access", "Competitor"],
  },
];

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    Qualification: "#60A5FA",
    Discovery: "#F59E0B",
    Proposal: "#8B5CF6",
    Negotiation: "#10B981",
  };
  return colors[stage] || "#6B7280";
};

export function DealPipeline({ onDealClick }: DealPipelineProps) {
  const totalDeals = mockDeals.length;
  const totalValue = mockDeals.reduce((sum, deal) => {
    const value = parseInt(deal.value.replace(/[$,]/g, ""));
    return sum + value;
  }, 0);
  const avgWinRate = Math.round(
    mockDeals.reduce((sum, deal) => sum + deal.winProbability, 0) / totalDeals
  );

  return (
    <div
      className="w-[260px] border-r flex flex-col overflow-hidden"
      style={{
        backgroundColor: "rgba(13, 17, 23, 0.5)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
        <h2 className="font-bold mb-3" style={{ fontSize: "15px", color: "#E5E7EB" }}>
          Deal Pipeline
        </h2>
        <div className="flex gap-2">
          <div
            className="flex-1 p-2 rounded-lg"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
          >
            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Deals</div>
            <div style={{ fontSize: "14px", color: "#E5E7EB", fontWeight: 600 }}>
              {totalDeals}
            </div>
          </div>
          <div
            className="flex-1 p-2 rounded-lg"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
          >
            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Pipeline</div>
            <div style={{ fontSize: "14px", color: "#E5E7EB", fontWeight: 600 }}>
              ${(totalValue / 1000).toFixed(0)}k
            </div>
          </div>
          <div
            className="flex-1 p-2 rounded-lg"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
          >
            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Avg Win</div>
            <div style={{ fontSize: "14px", color: "#E5E7EB", fontWeight: 600 }}>
              {avgWinRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Deal Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mockDeals.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className="p-3 rounded-lg cursor-pointer transition-all"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#6366F1";
              e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
            }}
          >
            <div className="mb-2">
              <div style={{ fontSize: "15px", color: "#E5E7EB", fontWeight: 700 }}>
                {deal.clientName}
              </div>
              <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{deal.company}</div>
            </div>

            <div
              className="mb-2"
              style={{
                fontSize: "16px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {deal.value}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-1 rounded-full"
                style={{
                  fontSize: "11px",
                  backgroundColor: `${getStageColor(deal.stage)}20`,
                  color: getStageColor(deal.stage),
                  fontWeight: 500,
                }}
              >
                {deal.stage}
              </span>
            </div>

            {/* Win Probability Bar */}
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Win Probability</span>
                <span style={{ fontSize: "11px", color: "#E5E7EB", fontWeight: 600 }}>
                  {deal.winProbability}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${deal.winProbability}%`,
                    background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)",
                  }}
                />
              </div>
            </div>

            {/* Objection Tags */}
            {deal.objections.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {deal.objections.map((objection, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded"
                    style={{
                      fontSize: "10px",
                      backgroundColor: "rgba(248, 113, 113, 0.15)",
                      color: "#F87171",
                      fontWeight: 500,
                    }}
                  >
                    ⚠️ {objection}
                  </span>
                ))}
              </div>
            )}

            {/* Dossier Button */}
            <button
              onClick={() => onDealClick(deal)}
              className="w-full py-1.5 rounded border transition-all hover:bg-white/5"
              style={{
                fontSize: "12px",
                color: "#8B5CF6",
                borderColor: "rgba(139, 92, 246, 0.3)",
                fontWeight: 500,
              }}
            >
              <FileText size={12} className="inline mr-1" />
              📋 Strategic Dossier
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
