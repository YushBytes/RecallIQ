import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Copy, Loader2 } from "lucide-react";
import { apiGetBriefing, getObjections, type Deal } from "../api";

interface DossierModalProps {
  deal: Deal;
  onClose: () => void;
}

export function DossierModal({ deal, onClose }: DossierModalProps) {
  const [dossier, setDossier] = useState("");
  const [memoriesUsed, setMemoriesUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const objections = getObjections(deal);

  useEffect(() => {
    async function fetchDossier() {
      try {
        const data = await apiGetBriefing(deal.id);
        setDossier(data.dossier);
        setMemoriesUsed(data.memories_used);
      } catch (err: any) {
        setError(err.message || "Failed to generate dossier");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDossier();
  }, [deal.id]);

  const formatDossier = (text: string) => {
    return text
      .replace(/^# (.*$)/gm, '<h2 style="font-size:20px;font-weight:700;color:#F5F5F5;margin:0 0 12px">$1</h2>')
      .replace(/^## (.*$)/gm, '<h3 style="font-size:16px;font-weight:600;color:#F5F5F5;margin:18px 0 8px">$1</h3>')
      .replace(/^### (.*$)/gm, '<h4 style="font-size:14px;font-weight:500;color:#8B5CF6;margin:12px 0 6px">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F5F5F5">$1</strong>')
      .replace(/^- (.*$)/gm, '<li style="margin-bottom:4px;color:#D1D5DB">$1</li>')
      .replace(/(<li.*<\/li>)/g, '<ul style="padding-left:20px;margin:8px 0">$1</ul>')
      .replace(/\n\n/g, '</p><p style="color:#D1D5DB;line-height:1.7;margin-bottom:10px">')
      .replace(/\n/g, "<br>");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dossier);
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
        className="w-full max-w-4xl rounded-lg p-8 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#1C1C1E", border: "1px solid rgba(255, 255, 255, 0.06)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#F5F5F5", marginBottom: "8px" }}>
              Strategic Dossier — {deal.client_name}
            </h2>
            <div className="flex gap-2 flex-wrap">
              <span className="inline-block px-2 py-1 rounded" style={{ fontSize: "11px", backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6", fontWeight: 500 }}>
                📚 Based on {memoriesUsed} memories
              </span>
              <span className="inline-block px-2 py-1 rounded" style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.05)", color: "#8A8A8E" }}>
                {deal.company} · ${(deal.deal_value || 0).toLocaleString()} · {deal.stage}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-white/5 transition-all" style={{ color: "#8A8A8E" }} title="Copy">
              <Copy size={18} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-all" style={{ color: "#8A8A8E" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Objections quick view */}
        {objections.length > 0 && (
          <div className="mb-6 p-3 rounded-lg flex flex-wrap gap-2" style={{ backgroundColor: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)" }}>
            <span style={{ fontSize: "12px", color: "#F87171", fontWeight: 500 }}>Active Objections:</span>
            {objections.map((o: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded" style={{ fontSize: "11px", backgroundColor: "rgba(248,113,113,0.1)", color: "#F87171" }}>⚠️ {o}</span>
            ))}
          </div>
        )}

        {/* Dossier Content */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3" style={{ color: "#8A8A8E" }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ fontSize: "14px" }}>Generating strategic dossier with Groq AI...</span>
          </div>
        )}
        {error && <p style={{ color: "#F87171", fontSize: "14px" }}>⚠️ {error}</p>}
        {dossier && !isLoading && (
          <div
            style={{ lineHeight: "1.8", color: "#D1D5DB" }}
            dangerouslySetInnerHTML={{ __html: `<p style="color:#D1D5DB;line-height:1.7;margin-bottom:10px">${formatDossier(dossier)}</p>` }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
