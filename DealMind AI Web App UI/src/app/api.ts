/**
 * DealMind AI — API Service Layer
 * Connects the React frontend to the FastAPI backend.
 */

export const API_BASE = 'http://localhost:8000/api';

// ─── Types ───

export interface Deal {
  id: string;
  client_name: string;
  company: string;
  deal_value: number;
  stage: string;
  win_probability: number;
  objections: string[] | string;
  notes?: string;
  ai_recommendation?: string;
}

export interface Memory {
  id: string;
  content: string;
  memory_type: 'experience' | 'world' | 'opinion';
  timestamp: number;
  created_at: string;
  relevance_score?: number;
  metadata?: Record<string, any>;
}

export interface MemoryStats {
  total: number;
  by_type: Record<string, number>;
  oldest?: string;
  newest?: string;
}

export interface ChatResponse {
  response: string;
  memories_used: Memory[];
  memory_count: number;
  learning_level: 'cold_start' | 'learning' | 'proficient' | 'expert';
  learning_label: string;
}

export interface ReflectResponse {
  reflection: string;
  memories_analyzed: number;
  total_memories: number;
  memories: Memory[];
}

export interface BriefingResponse {
  dossier: string;
  memories_used: number;
}

export interface PipelineStats {
  total_deals: number;
  total_pipeline_value: number;
  average_win_probability: number;
}

// ─── API Functions ───

export async function apiChat(
  message: string,
  conversationHistory: { role: string; content: string }[],
  dealId?: string | null
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory.slice(-10),
      deal_id: dealId,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Chat failed');
  }
  return res.json();
}

export async function apiReflect(query: string): Promise<ReflectResponse> {
  const res = await fetch(`${API_BASE}/reflect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Reflection failed');
  return res.json();
}

export async function apiGetMemories(): Promise<{ memories: Memory[]; stats: MemoryStats }> {
  const res = await fetch(`${API_BASE}/memory`);
  if (!res.ok) throw new Error('Failed to load memories');
  return res.json();
}

export async function apiGetDeals(): Promise<{ deals: Deal[] }> {
  const res = await fetch(`${API_BASE}/deals`);
  if (!res.ok) throw new Error('Failed to load deals');
  return res.json();
}

export async function apiGetDealStats(): Promise<PipelineStats> {
  const res = await fetch(`${API_BASE}/deals/stats`);
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

export async function apiGetBriefing(dealId: string): Promise<BriefingResponse> {
  const res = await fetch(`${API_BASE}/briefing/${dealId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Dossier generation failed');
  }
  return res.json();
}

export async function apiReset(): Promise<void> {
  await fetch(`${API_BASE}/reset`, { method: 'POST' });
}

// ─── Helpers ───

export function getObjections(deal: Deal): string[] {
  if (Array.isArray(deal.objections)) return deal.objections;
  try { return JSON.parse(deal.objections as string); } catch { return []; }
}

export function getLearningLevel(total: number): { level: string; label: string } {
  if (total <= 3) return { level: 'cold_start', label: "🧊 Just woke up — Building initial context" };
  if (total <= 10) return { level: 'learning', label: "📚 Starting to learn — Recognizing patterns" };
  if (total <= 20) return { level: 'proficient', label: "🎯 Getting sharp — Personalized insights" };
  return { level: 'expert', label: "🧠 Expert mode — Deep contextual intelligence" };
}
