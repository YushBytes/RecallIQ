/**
 * DealMind AI — Frontend Application Logic
 * Connects to FastAPI backend, manages chat, memory panel, and deals dashboard.
 */

const API_BASE = 'http://localhost:8000/api';

// ─── State ───
let conversationHistory = [];
let currentDealId = null;
let memoryFilter = 'all';

// ─── DOM Elements ───
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const btnSend = document.getElementById('btnSend');
const dealsList = document.getElementById('dealsList');
const memoryList = document.getElementById('memoryList');
const memoryStats = document.getElementById('memoryStats');
const pipelineStats = document.getElementById('pipelineStats');
const learningIndicator = document.getElementById('learningIndicator');
const reflectionModal = document.getElementById('reflectionModal');
const reflectInput = document.getElementById('reflectInput');
const reflectResult = document.getElementById('reflectResult');

// ─── Initialize ───
document.addEventListener('DOMContentLoaded', () => {
    loadDeals();
    loadMemories();
    setupEventListeners();
});

function setupEventListeners() {
    btnSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Reflect button
    document.getElementById('btnReflect').addEventListener('click', () => {
        reflectionModal.classList.add('active');
        reflectInput.focus();
    });

    document.getElementById('btnDoReflect').addEventListener('click', doReflect);
    reflectInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doReflect();
    });

    // Reset button
    document.getElementById('btnReset').addEventListener('click', async () => {
        if (confirm('Reset all data? This will clear memories and deals, then re-seed sample data.')) {
            await fetch(`${API_BASE}/reset`, { method: 'POST' });
            conversationHistory = [];
            chatMessages.innerHTML = createWelcomeHTML();
            loadDeals();
            loadMemories();
        }
    });

    // Memory filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            memoryFilter = chip.dataset.type;
            loadMemories();
        });
    });
}

// ─── Chat ───

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Remove welcome message
    const welcome = chatMessages.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    // Add user message
    appendMessage('user', message);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    btnSend.disabled = true;

    // Show typing indicator
    const typingEl = showTypingIndicator();

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                conversation_history: conversationHistory.slice(-10),
                deal_id: currentDealId,
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Server error');
        }

        const data = await response.json();

        // Remove typing indicator
        typingEl.remove();

        // Add assistant message
        appendMessage('assistant', data.response, data);

        // Update conversation history
        conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: data.response }
        );

        // Update learning indicator
        updateLearningIndicator(data.learning_level, data.learning_label);

        // Refresh memory panel
        loadMemories();

    } catch (error) {
        typingEl.remove();
        appendMessage('assistant', `⚠️ Error: ${error.message}. Make sure the backend is running on localhost:8000.`);
    }

    btnSend.disabled = false;
    chatInput.focus();
}

function sendSuggestion(text) {
    chatInput.value = text;
    sendMessage();
}

function appendMessage(role, content, metadata = null) {
    const div = document.createElement('div');
    div.className = `message message-${role}`;

    const avatar = role === 'user' ? '👤' : '🧠';
    const formattedContent = formatMarkdown(content);

    let metaHTML = '';
    if (metadata && role === 'assistant') {
        const badges = [];
        if (metadata.memories_used && metadata.memories_used.length > 0) {
            badges.push(`<span class="memory-badge">🔗 ${metadata.memories_used.length} memories used</span>`);
        }
        if (metadata.memory_count !== undefined) {
            badges.push(`<span class="memory-badge">📦 ${metadata.memory_count} total memories</span>`);
        }
        if (badges.length > 0) {
            metaHTML = `<div class="message-meta">${badges.join('')}</div>`;
        }
    }

    div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div>
            <div class="message-content">${formattedContent}</div>
            ${metaHTML}
        </div>
    `;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message message-assistant';
    div.innerHTML = `
        <div class="message-avatar">🧠</div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
}

function formatMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n- /g, '<br>• ')
        .replace(/\n(\d+)\. /g, '<br>$1. ')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

function updateLearningIndicator(level, label) {
    learningIndicator.setAttribute('data-level', level);
    learningIndicator.querySelector('.learning-text').textContent = label;
}

function createWelcomeHTML() {
    return `
        <div class="welcome-message">
            <div class="welcome-icon">🧠</div>
            <h3>Welcome to DealMind AI</h3>
            <p>I'm your sales intelligence agent with persistent memory. I remember every interaction and get smarter over time.</p>
            <div class="welcome-suggestions">
                <button class="suggestion-chip" onclick="sendSuggestion('What do you know about the TechNova deal?')">TechNova deal status?</button>
                <button class="suggestion-chip" onclick="sendSuggestion('Sarah Chen is pushing back on pricing. How should I handle this?')">Handle pricing objection</button>
                <button class="suggestion-chip" onclick="sendSuggestion('Compare our competitive position against Salesforce for Retail Dynamics')">Salesforce competition</button>
                <button class="suggestion-chip" onclick="sendSuggestion('What are the top objections across my deals and how should I address them?')">Analyze all objections</button>
            </div>
        </div>
    `;
}

// ─── Deals Dashboard ───

async function loadDeals() {
    try {
        const [dealsRes, statsRes] = await Promise.all([
            fetch(`${API_BASE}/deals`),
            fetch(`${API_BASE}/deals/stats`),
        ]);

        const dealsData = await dealsRes.json();
        const statsData = await statsRes.json();

        renderDeals(dealsData.deals || []);
        renderPipelineStats(statsData);
    } catch (error) {
        dealsList.innerHTML = '<p style="color:var(--text-muted);padding:16px;font-size:12px">⚠️ Cannot load deals. Start the backend server.</p>';
    }
}

function renderDeals(deals) {
    if (!deals.length) {
        dealsList.innerHTML = '<p style="color:var(--text-muted);padding:16px;font-size:12px">No deals yet</p>';
        return;
    }

    dealsList.innerHTML = deals.map(deal => {
        const objections = Array.isArray(deal.objections) ? deal.objections : [];
        const prob = deal.win_probability || 0;
        const probPct = (prob * 100).toFixed(0);
        const stageClass = `stage-${deal.stage}`;

        return `
            <div class="deal-card ${deal.id === currentDealId ? 'active' : ''}" onclick="selectDeal('${deal.id}')">
                <div class="deal-client">${escapeHtml(deal.client_name)}</div>
                <div class="deal-company">${escapeHtml(deal.company || 'No company')}</div>
                <div class="deal-meta">
                    <span class="deal-value">$${(deal.deal_value || 0).toLocaleString()}</span>
                    <span class="deal-stage ${stageClass}">${deal.stage.replace('_', ' ')}</span>
                </div>
                <div class="deal-probability">
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted)">
                        <span>Win probability</span><span>${probPct}%</span>
                    </div>
                    <div class="prob-bar"><div class="prob-fill" style="width:${probPct}%"></div></div>
                </div>
                ${objections.length ? `
                    <div class="deal-objections">
                        ${objections.map(o => `<span class="objection-tag">⚠️ ${escapeHtml(o)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderPipelineStats(stats) {
    pipelineStats.innerHTML = `
        <div class="stat-badge">
            <span class="stat-value">${stats.total_deals || 0}</span>
            <span class="stat-label">Deals</span>
        </div>
        <div class="stat-badge">
            <span class="stat-value">$${((stats.total_pipeline_value || 0) / 1000).toFixed(0)}K</span>
            <span class="stat-label">Pipeline</span>
        </div>
        <div class="stat-badge">
            <span class="stat-value">${stats.average_win_probability || 0}%</span>
            <span class="stat-label">Avg Win</span>
        </div>
    `;
}

function selectDeal(dealId) {
    currentDealId = currentDealId === dealId ? null : dealId;
    loadDeals();
}

// ─── Memory Panel ───

async function loadMemories() {
    try {
        const res = await fetch(`${API_BASE}/memory`);
        const data = await res.json();

        renderMemoryStats(data.stats || {});
        renderMemories(data.memories || []);

        // Update learning indicator from stats
        const total = data.stats?.total || 0;
        if (total <= 3) updateLearningIndicator('cold_start', '🧊 Cold Start — Building initial context');
        else if (total <= 10) updateLearningIndicator('learning', '📚 Learning — Recognizing patterns');
        else if (total <= 20) updateLearningIndicator('proficient', '🎯 Proficient — Providing personalized insights');
        else updateLearningIndicator('expert', '🧠 Expert — Deep contextual intelligence');

    } catch (error) {
        memoryList.innerHTML = '<p style="color:var(--text-muted);padding:16px;font-size:12px">⚠️ Cannot load memories. Start the backend server.</p>';
    }
}

function renderMemoryStats(stats) {
    const byType = stats.by_type || {};
    memoryStats.innerHTML = `
        <div class="memory-stat">
            <span class="stat-value">${stats.total || 0}</span>
            <span class="stat-label">Total</span>
        </div>
        <div class="memory-stat">
            <span class="stat-value">${byType.experience || 0}</span>
            <span class="stat-label">Experiences</span>
        </div>
        <div class="memory-stat">
            <span class="stat-value">${(byType.world || 0) + (byType.opinion || 0)}</span>
            <span class="stat-label">Facts/Insights</span>
        </div>
    `;
}

function renderMemories(memories) {
    let filtered = memories;
    if (memoryFilter !== 'all') {
        filtered = memories.filter(m => m.memory_type === memoryFilter);
    }

    if (!filtered.length) {
        memoryList.innerHTML = `<p style="color:var(--text-muted);padding:16px;font-size:12px;text-align:center">No ${memoryFilter === 'all' ? '' : memoryFilter + ' '}memories yet</p>`;
        return;
    }

    memoryList.innerHTML = filtered.map(mem => {
        const typeClass = `type-${mem.memory_type}`;
        const time = new Date(mem.created_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `
            <div class="memory-item" onclick="this.classList.toggle('expanded')">
                <div class="memory-item-header">
                    <span class="memory-type-badge ${typeClass}">${mem.memory_type}</span>
                    <span class="memory-time">${time}</span>
                </div>
                <div class="memory-item-content">${escapeHtml(mem.content)}</div>
            </div>
        `;
    }).join('');
}

// ─── Reflection Modal ───

async function doReflect() {
    const query = reflectInput.value.trim();
    if (!query) return;

    reflectResult.textContent = '🔮 Reflecting on memories...';
    reflectResult.style.display = 'block';

    try {
        const res = await fetch(`${API_BASE}/reflect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        const data = await res.json();
        reflectResult.innerHTML = `
            <div style="margin-bottom:12px;font-size:12px;color:var(--text-muted)">
                📊 Analyzed ${data.memories_analyzed} memories | 📦 ${data.total_memories || '?'} total in bank
            </div>
            ${formatMarkdown(data.reflection)}
        `;

        // Refresh memory panel (reflection creates new opinion memory)
        loadMemories();

    } catch (error) {
        reflectResult.textContent = `⚠️ Error: ${error.message}`;
    }
}

function closeReflectionModal() {
    reflectionModal.classList.remove('active');
    reflectResult.textContent = '';
}

// Click outside modal to close
reflectionModal.addEventListener('click', (e) => {
    if (e.target === reflectionModal) closeReflectionModal();
});

// ─── Utilities ───

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
