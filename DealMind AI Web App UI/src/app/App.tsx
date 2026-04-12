import { useState, useEffect, useCallback } from "react";
import { TopNav } from "./components/TopNav";
import { BrainFeedBar } from "./components/BrainFeedBar";
import { CollapsibleSidebar } from "./components/CollapsibleSidebar";
import { ChatInterface } from "./components/ChatInterface";
import { MemoryDrawer } from "./components/MemoryDrawer";
import { ReflectModal } from "./components/ReflectModal";
import { PersonaModal } from "./components/PersonaModal";
import { DossierModal } from "./components/DossierModal";
import {
  apiChat,
  apiGetMemories,
  apiGetDeals,
  apiGetDealStats,
  apiReset,
  getLearningLevel,
  type Memory,
  type MemoryStats,
  type Deal,
  type PipelineStats,
} from "./api";

export interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  memoriesRecalled?: number;
  totalMemories?: number;
}

export default function App() {
  const [activeModal, setActiveModal] = useState<"reflect" | "persona" | "dossier" | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [recalledMemoryIds, setRecalledMemoryIds] = useState<Set<string>>(new Set());
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Real data state
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({ total: 0, by_type: {} });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats>({ total_deals: 0, total_pipeline_value: 0, average_win_probability: 0 });
  const [learningInfo, setLearningInfo] = useState({ level: "cold_start", label: "🧊 Just woke up — Building initial context" });

  // Brain Feed
  const [brainFeedText, setBrainFeedText] = useState("Memory indexed — Ask me anything");
  const [isBrainFeedActive, setIsBrainFeedActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [currentDealId, setCurrentDealId] = useState<string | null>(null);

  // ─── Load Data ───

  const loadMemories = useCallback(async () => {
    try {
      const data = await apiGetMemories();
      setMemories(data.memories || []);
      setMemoryStats(data.stats || { total: 0, by_type: {} });
      setLearningInfo(getLearningLevel(data.stats?.total || 0));
    } catch { /* server may not be up yet */ }
  }, []);

  const loadDeals = useCallback(async () => {
    try {
      const [dealsData, statsData] = await Promise.all([apiGetDeals(), apiGetDealStats()]);
      setDeals(dealsData.deals || []);
      setPipelineStats(statsData);
    } catch { /* server may not be up yet */ }
  }, []);

  useEffect(() => {
    loadMemories();
    loadDeals();
  }, [loadMemories, loadDeals]);

  // ─── Brain Feed helpers ───

  const activateBrainFeed = (text: string) => {
    setBrainFeedText(text);
    setIsBrainFeedActive(true);
  };

  const deactivateBrainFeed = (text: string) => {
    setBrainFeedText(text);
    setIsBrainFeedActive(false);
  };

  // ─── Chat ───

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Brain Feed flicker
    const feedMessages = [
      "🔍 Recalling relevant memories...",
      "⚙️ Running TF-IDF + Temporal Decay search...",
      "📊 Summarizing context window via Groq...",
      "🧠 Building enriched system prompt...",
    ];
    let idx = 0;
    activateBrainFeed(feedMessages[0]);
    const feedInterval = setInterval(() => {
      idx++;
      if (idx < feedMessages.length) activateBrainFeed(feedMessages[idx]);
    }, 700);

    try {
      const data = await apiChat(text, conversationHistory, currentDealId);

      clearInterval(feedInterval);
      setIsTyping(false);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.response,
        timestamp: new Date(),
        memoriesRecalled: data.memories_used?.length || 0,
        totalMemories: data.memory_count,
      };
      setMessages((prev) => [...prev, aiMessage]);

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: data.response },
      ]);

      setLearningInfo({ level: data.learning_level, label: data.learning_label });

      // Flash recalled memories
      const recalled = new Set(data.memories_used?.map((m: Memory) => m.id) || []);
      setRecalledMemoryIds(recalled);
      setTimeout(() => setRecalledMemoryIds(new Set()), 2500);

      // Brain feed result
      if (data.memories_used?.length > 0) {
        const shortContent = data.memories_used[0].content.substring(0, 55) + "...";
        deactivateBrainFeed(`✅ Recalled: "${shortContent}"`);
      } else {
        deactivateBrainFeed("Ready — No prior memories found for this query");
      }

      // Refresh memory panel
      loadMemories();

    } catch (error: any) {
      clearInterval(feedInterval);
      setIsTyping(false);
      deactivateBrainFeed(`⚠️ ${error.message}`);

      const errMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `⚠️ Error: ${error.message}. Make sure the backend is running on localhost:8000.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMessage]);
    }
  };

  // ─── Reset ───

  const handleReset = async () => {
    if (!confirm("Reset all data? This will clear memories and deals, then re-seed sample data.")) return;
    await apiReset();
    setMessages([]);
    setConversationHistory([]);
    deactivateBrainFeed("✅ Data reset and re-seeded successfully");
    loadMemories();
    loadDeals();
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ backgroundColor: "#141414" }}>
      {/* Top Navigation */}
      <TopNav
        onPersonaClick={() => setActiveModal("persona")}
        onReflectClick={() => setActiveModal("reflect")}
        onResetClick={handleReset}
        learningLabel={learningInfo.label}
        learningLevel={learningInfo.level}
      />

      {/* Brain Feed Whisper */}
      <BrainFeedBar isActive={isBrainFeedActive} text={brainFeedText} />

      {/* Main Layout: Sidebar + Chat */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Left Sidebar */}
        <CollapsibleSidebar
          isExpanded={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
          onMemoryClick={() => setIsMemoryDrawerOpen(true)}
          onDealClick={(deal) => {
            setCurrentDealId(deal.id);
            setSelectedDeal(deal);
            setActiveModal("dossier");
            setIsSidebarExpanded(false);
          }}
          deals={deals}
          pipelineStats={pipelineStats}
        />

        {/* Chat Interface - Full Width Hero */}
        <ChatInterface
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
        />

        {/* Memory Drawer - Slide Over from Right */}
        <MemoryDrawer
          isOpen={isMemoryDrawerOpen}
          onClose={() => setIsMemoryDrawerOpen(false)}
          recalledMemoryIds={recalledMemoryIds}
          memories={memories}
          memoryStats={memoryStats}
        />
      </div>

      {/* Modals */}
      {activeModal === "reflect" && (
        <ReflectModal
          onClose={() => { setActiveModal(null); loadMemories(); }}
        />
      )}
      {activeModal === "persona" && (
        <PersonaModal
          onClose={() => setActiveModal(null)}
          memories={memories}
          totalMemories={memoryStats.total}
        />
      )}
      {activeModal === "dossier" && selectedDeal && (
        <DossierModal
          deal={selectedDeal}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
