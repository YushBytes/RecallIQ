import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, RotateCcw, ShieldCheck, Database } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
  onClearChat: () => void;
  onResetAll: () => void;
}

export function SettingsModal({ onClose, onClearChat, onResetAll }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: "#1C1C1E",
          borderColor: "rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 px-6" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-100">Intelligence Settings</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-all hover:bg-white/5 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Data Management Section */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Data Management</h3>
            <div className="space-y-3">
              <button
                onClick={onClearChat}
                className="group flex w-full items-center justify-between rounded-xl border p-4 transition-all hover:bg-white/5"
                style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
                    <Trash2 size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-200">Clear Chat History</div>
                    <div className="text-xs text-gray-500">Removes messages but keeps memories</div>
                  </div>
                </div>
              </button>

              <button
                onClick={onResetAll}
                className="group flex w-full items-center justify-between rounded-xl border p-4 transition-all hover:bg-red-500/5 hover:border-red-500/20"
                style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
                    <RotateCcw size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-200">Perform Factory Reset</div>
                    <div className="text-xs text-gray-500">Clears all memories and re-seeds sample data</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="rounded-xl bg-white/5 p-4 border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <div className="text-sm font-medium text-gray-200">Local-First Intelligence</div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your deal intelligence and voice-of-customer memories are stored locally in your browser and on your private server. No data is used for training third-party models.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/[0.02] p-4 text-center">
            <p className="text-[10px] text-gray-600">DealMind AI — Version 1.2.0 (Stable)</p>
        </div>
      </motion.div>
    </div>
  );
}
