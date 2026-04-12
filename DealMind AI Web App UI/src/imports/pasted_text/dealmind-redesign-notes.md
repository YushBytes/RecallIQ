Redesign the DealMind AI web app to feel like a premium, breathing, human sales companion. The current design is too cluttered with 3 equal-weight panels. The new design should have ONE hero area (chat), with everything else staying out of the way until needed.

🔑 Core Design Philosophy Change
Old: 3 panels side by side, all equal weight → feels like a spreadsheet
New: Chat is 100% the hero. Sidebar panels are collapsible drawers that slide out only when needed. Think Notion or Linear — calm, generous, focused.
📐 New Layout (1440×900px)
┌─────────────────────────────────────────────────────────┐
│  🧠 DealMind AI          [🧊 Cold Start]    [Persona] [⋮]│
├─────────────────────────────────────────────────────────┤
│  ⚡ Memory indexed — Ask me anything                     │
├──────────┬──────────────────────────────────────────────┤
│ [sidebar]│                                              │
│ collapsed│         CHAT — full width hero               │
│ (icon-   │                                              │
│  only)   │                                              │
│          │                                              │
│          ├──────────────────────────────────────────────┤
│          │  ╰ Ask about deals, objections, strategy...  │
└──────────┴──────────────────────────────────────────────┘
Left sidebar: collapsed to 56px icon rail by default. Hover/click to expand to 280px with a smooth slide. Shows pipeline icon, memory icon, settings icon as slim vertical nav.
No right panel at all by default — Memory Bank becomes a slide-over drawer from the right, triggered by clicking the memory icon.
🎨 Color & Mood Overhaul
Stop using dark navy. Use warm charcoal instead:

Background: #141414 (warm charcoal, not cold navy)
Surface: #1C1C1E (Apple-dark-style warm card)
Border: rgba(255,255,255,0.06) — ultra-subtle
Accent: Keep indigo #6366F1 but use it only on interactive elements, not everywhere
Text primary: #F5F5F5 (warm white, not pure white)
Text secondary: #8A8A8E (Apple's secondary grey)
Result: Feels like an iPhone at night, not a hacker terminal.

🔝 Navbar — Simpler, Airier
Height: 52px only. No visual noise.
Left: 🧠 icon + "DealMind AI" (AI in gradient, rest in regular weight)
Center: Learning level pill — but make it larger and more expressive:
180px wide pill with icon + label + animated dot
Stages: 🧊 Just woke up → 📚 Starting to learn → 🎯 Getting sharp → 🧠 Expert mode
Use human language, not robotic labels
Right: Just 2 icons — Persona silhouette icon, overflow menu ⋮
⚡ Brain Feed — Make it a Whisper, Not a Shout
Current: bright bar that competes with content
New: single line of italic, muted text that sits just above the chat, left-aligned
Style: font-style: italic; color: #555; font-size: 12px;
When active: text fades in/out smoothly like a thought bubble
Example: "...recalling 3 memories about pricing objections"
No background color, no border, no box — just floating text
💬 Chat — Full Width, Breathable
Message bubbles redesign:

User messages: Right-aligned. No hard gradient bubble. Instead: soft rgba(99,102,241,0.15) background with 1px solid rgba(99,102,241,0.3) border. Feels like a highlight, not a shout.
AI messages: Left-aligned. Avatar is a small 🧠 circle (28px). Message in plain card, wide and comfortable. max-width: 72%
Memory recall badges move to a tiny footnote below the response: 🔗 recalled 3 memories · 47 total in 11px muted text. Not pills — just text.
Welcome Screen:

Remove all 4 suggestion chips from the center layout
Instead: 2 rows of suggestion chips at the bottom, inside the input area (like Claude/ChatGPT's suggestion row)
Center of screen: Just the floating brain emoji and 2-line headline. Minimal. Generous whitespace.
📊 Left Sidebar (Collapsed by Default)
Icon rail (56px wide when collapsed):

Pipeline icon 📊
Memory icon 🧠
Separator
Settings icon
Expanded state (280px, slides over chat with shadow):

Deal cards get a complete redesign:

Remove probability bar (visual noise)
Instead: one-line summary: Sarah Chen · Acme · $125K · Proposal
Small colored stage dot on the left
Objection count: ⚠️ 2 objections in small amber text
Hover reveals action row: Chat about this + 📋 Dossier — appear only on hover
🧠 Memory Bank — Slide-Over Drawer (Right)
Triggered by clicking the memory icon in the sidebar rail. Slides in from right at 340px wide with a dark overlay behind it.

Inside the drawer:

Header: "Memory Bank" + total count + close X
Tabs: Experience / Facts / Insights / Playbook (horizontal, slim)
Each memory item is a conversational card:
No header row with badge + timestamp on the same line (too dense)
Instead: type dot on left (●), content text, timestamp in bottom-right corner
3-line clamp, click to expand
🪟 Modals — Make Them Feel Premium
Persona Evolution Modal:

Full-width timeline, entries spaced 20px apart
Each entry: large left-side type icon (32px circle), content on right
Timeline connector: thin vertical line between entries
Entry text is conversational: "I learned Sarah prefers data-backed proposals" not "WORLD: competitor_intel: Hubspot"
Strategic Dossier Modal:

Top: Deal name in large heading + a sub-badge 📚 Based on 12 memories
Content formatted like a Google Doc — white-on-dark paper feel
Sections use clear H2/H3 hierarchy with generous padding between them
Add a "Copy" and "Share" button in the top-right corner
🌀 Animation Rules (Less is More)
Remove all pulsing glow effects except on the learning level dot
Keep only: message slideUp, modal scaleIn, sidebar slide
Brain feed text: simple opacity: 0 → 1 crossfade, 0.4s ease
Memory flash: just a 0.5s background color transition — no keyframe animation needed
📌 Golden Rule for This Redesign
If it's not in the user's eyeline right now, hide it. Every panel, badge, and label should earn its screen space. The chat should feel like iMessage, not a CRM.

