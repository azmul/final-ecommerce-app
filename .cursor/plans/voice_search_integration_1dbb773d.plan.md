---
name: Voice Search Integration
overview: Add Web Speech API voice input to both the floating chat widget and `/ai-search`, then extend the existing LLM+RAG assistant so responses include knowledge/content cards—not just products—across all indexed site content.
todos:
  - id: voice-hook
    content: Create useSpeechRecognition hook + VoiceInputButton/VoiceStatusBar with idle/listening/processing/error states
    status: completed
  - id: chat-composer
    content: Build ChatComposer (textarea + mic + send) and integrate into ChatPanel and AiSearchExperience
    status: completed
  - id: csp-fix
    content: Update next.config.ts Permissions-Policy to microphone=(self)
    status: completed
  - id: assistant-knowledge
    content: Extend runShoppingAssistant to collect/return knowledgeChunks; wire through API and AiSearchExperience assistant mode
    status: completed
  - id: chat-persist-knowledge
    content: Extend productMessage encoding, ChatMessageDTO, chatAssistant, and ChatMessageBubble to persist/render knowledge cards
    status: completed
  - id: promo-tool
    content: Add listActivePromoCodes tool + systemPrompt routing for coupon/deal queries
    status: completed
  - id: tests
    content: Add unit tests for speech hook + message parsing; integration test for knowledge in assistant; E2E mic visibility
    status: completed
isProject: false
---

# Voice Search Integration Plan

## Current State

The project already has a strong AI search stack; voice is the main missing layer.

| Layer | Status |
|-------|--------|
| Floating chat (`ChatWidget` → `ChatPanel`) | Text-only; AI via `maybeReplyWithShoppingAssistant` → `runShoppingAssistant` |
| `/ai-search` page | 4 manual modes; assistant mode calls `/api/ai/assistant` |
| LLM tool routing | `searchProducts`, `semanticSearch`, `searchKnowledgeBase`, `checkPromoCode`, `getLoyaltyBalance`, etc. in [`src/lib/ai/tools.ts`](src/lib/ai/tools.ts) |
| RAG index | Pages, posts, products, categories, brands, header/footer in [`src/lib/ai/rag/syncContentDocument.ts`](src/lib/ai/rag/syncContentDocument.ts) |
| Result UI | Product cards in chat; knowledge cards only in Help mode on `/ai-search` |
| Voice | **None**; CSP blocks mic: `microphone=()` in [`next.config.ts`](next.config.ts) line 172 |

**Key gap:** Assistant mode returns `{ reply, products }` only—knowledge snippets from `searchKnowledgeBase` are consumed by the LLM but never surfaced as cards in chat or assistant mode.

**Out of scope (not in codebase):** Candidates/biodata, sellers. Promo codes exist (`promo-codes` collection) but are validated at runtime, not indexed for discovery queries like "today's best coupons."

```mermaid
flowchart LR
  subgraph voice [New Voice Layer]
    Mic[VoiceInputButton]
    Hook[useSpeechRecognition]
    Mic --> Hook
  end

  subgraph ui [Existing UI]
    ChatPanel[ChatPanel]
    AiSearch[AiSearchExperience]
  end

  subgraph backend [Existing + Extended Backend]
    Assistant[/api/ai/assistant]
    Agent[runShoppingAssistant]
    Tools[LLM Tools]
    RAG[searchKnowledgeBase]
  end

  Hook -->|transcript fills textarea| ChatPanel
  Hook -->|transcript fills textarea| AiSearch
  ChatPanel -->|manual Send| Assistant
  AiSearch -->|manual Send assistant mode| Assistant
  Assistant --> Agent --> Tools
  Tools --> RAG
  Agent -->|reply + products + knowledgeChunks| ChatPanel
  Agent -->|reply + products + knowledgeChunks| AiSearch
```

---

## Architecture

### 1. Voice Input Hook + Component

Create [`src/hooks/useSpeechRecognition.ts`](src/hooks/useSpeechRecognition.ts):

- Wrap **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`)
- Feature-detect support; expose `isSupported`, `state`, `transcript`, `interimTranscript`, `error`
- States: `idle` | `listening` | `processing` | `error`
- Config: `continuous: true`, `interimResults: true`, `lang` from locale (default `en-US`; consider `bn-BD` later)
- **Silence stop:** restart `onend` while listening, or use a ~1.5s no-interim timer to call `stop()` (transcript stays in textarea; **no auto-submit** per your choice)
- Error mapping: `not-allowed` → permission denied, `no-speech` → no speech detected, `network` → network error, `aborted` → user cancelled
- Cleanup on unmount; single active session guard

Create [`src/components/chat/VoiceInputButton.tsx`](src/components/chat/VoiceInputButton.tsx):

- Mic icon (`Mic` / `MicOff` / pulsing `Loader2`) with `aria-pressed`, `aria-label`
- Visual states: idle (muted mic), listening (pulse ring animation), processing (spinner), error (toast via sonner)
- Props: `disabled`, `onTranscript(final)`, `onInterimTranscript`, `onStateChange`, `className`
- Optional [`src/components/chat/VoiceStatusBar.tsx`](src/components/chat/VoiceStatusBar.tsx): small banner above input showing "Listening…" + live interim text with `aria-live="polite"`

### 2. Shared Input Shell

Extract a reusable [`src/components/chat/ChatComposer.tsx`](src/components/chat/ChatComposer.tsx) used by both surfaces:

- Textarea + Send + **VoiceInputButton**
- Props: `value`, `onChange`, `onSubmit`, `isBusy`, `placeholder`, `maxLength`
- Voice fills `value` via `onChange`; user reviews and presses Send
- Keyboard: Enter to send, Shift+Enter newline (existing behavior)
- Footer hint: "Press Enter to send · Click mic to speak"

Wire into:
- [`src/components/chat/ChatPanel.tsx`](src/components/chat/ChatPanel.tsx) — replace inline form (lines 274–310)
- [`src/components/ai-search/AiSearchExperience.tsx`](src/components/ai-search/AiSearchExperience.tsx) — replace its search input form

On `/ai-search`, when voice is used, **keep current mode** but show a subtle hint that Smart AI mode gives best website-wide results (optional nudge toast if mode ≠ `assistant`).

### 3. CSP / Permissions Fix

Update [`next.config.ts`](next.config.ts):

```ts
// Change microphone=() → microphone=(self)
'microphone=(self)'
```

Without this, `getUserMedia` / SpeechRecognition permission prompts fail in production.

---

## Backend: Website-Wide Result Cards

### 4. Extend Assistant Response Type

In [`src/lib/ai/agent.ts`](src/lib/ai/agent.ts):

- Add `knowledgeChunks` to `ShoppingAssistantResult` (reuse shape from [`src/components/ai-search/types.ts`](src/components/ai-search/types.ts))
- Add `extractKnowledgeFromToolResult()` mirroring `extractProductsFromToolResult()`
- When `searchKnowledgeBase` tool runs, collect chunks into `collectedKnowledge`
- Return deduped top-N chunks (e.g. 6) alongside products

[`src/app/(app)/api/ai/assistant/route.ts`](src/app/(app)/api/ai/assistant/route.ts) already returns `result` JSON—no route change needed beyond the extended shape.

### 5. Persist Knowledge in Chat Widget

Extend [`src/lib/chat/productMessage.ts`](src/lib/chat/productMessage.ts):

- Generalize payload to `ChatRichMessagePayload` with optional `products` and `knowledgeChunks`
- Update `encodeProductMessage` / `parseChatMessageBody` (keep backward compat for existing `product_results` messages)
- Update [`src/lib/ai/chatAssistant.ts`](src/lib/ai/chatAssistant.ts) to encode knowledge when present
- Extend [`src/lib/chat/types.ts`](src/lib/chat/types.ts) `ChatMessageDTO` with `knowledgeChunks?: KnowledgeChunkResult[]`
- Update message DTO mapper in chat API routes to parse rich payloads

### 6. Render Knowledge in Chat Bubbles

Update [`src/components/chat/ChatMessageBubble.tsx`](src/components/chat/ChatMessageBubble.tsx):

- After reply text, render `KnowledgeResults` (already exists at [`src/components/ai-search/KnowledgeResults.tsx`](src/components/ai-search/KnowledgeResults.tsx)) when `message.knowledgeChunks?.length`
- Reuse existing product block for `message.products`

Update [`src/components/ai-search/AiSearchExperience.tsx`](src/components/ai-search/AiSearchExperience.tsx) assistant branch (~line 190) to pass `json.knowledgeChunks` into `assistantMessage`.

### 7. Promo / Deals Discovery (lightweight)

Add tool `listActivePromoCodes` in [`src/lib/ai/tools.ts`](src/lib/ai/tools.ts) + handler in [`src/lib/ai/executeTool.ts`](src/lib/ai/executeTool.ts):

- Query `promo-codes` where `active: true`, within valid date range, public-safe fields only (code, discount summary, validUntil)
- Enables "Show me today's best coupons" without full RAG reindex
- Update [`src/lib/ai/systemPrompt.ts`](src/lib/ai/systemPrompt.ts) to route deal/coupon queries to this tool

Optional follow-up (not required for MVP): add `promo-codes` to `RAG_SYNC_COLLECTIONS` for semantic "deals" queries.

### 8. System Prompt Tweaks

In [`src/lib/ai/systemPrompt.ts`](src/lib/ai/systemPrompt.ts):

- Clarify that voice queries may be conversational/noisy—extract intent, don't ask user to retype filters
- Instruct model to call `searchKnowledgeBase` for policies, blog, FAQs, support, pages
- Instruct citing `sourceUrl` from knowledge chunks when answering content questions

---

## UX State Mapping

| User-visible state | Trigger |
|--------------------|---------|
| Idle | Default; mic available |
| Listening | Mic clicked; pulse animation + interim transcript in `VoiceStatusBar` |
| Processing | Speech ended; STT finalizing (~brief) |
| AI Thinking | Existing `isSending` / `isSearching` + `ChatThinkingIndicator` |
| Response Ready | Message bubble with text + product/knowledge cards |

Voice errors show inline toast + mic returns to idle; textarea keeps any partial transcript.

---

## Error Handling

| Error | User message | Recovery |
|-------|--------------|----------|
| Browser unsupported | "Voice input isn't supported in this browser. Type your question instead." | Hide mic button |
| Permission denied | "Microphone access blocked. Enable it in browser settings." | Show link to retry |
| No speech | "Didn't catch that. Try again." | Auto-return to idle |
| Recognition timeout | "Listening timed out." | Stop + keep partial text |
| Network (STT) | "Voice recognition failed. Check connection or type instead." | Retry button |
| AI 503/500 | Existing error handling + "AI assistant unavailable" | Fallback to typed search |

---

## Accessibility & Mobile

- Mic button: `type="button"`, focus ring, 44px touch target on mobile
- Live region for interim + final transcript
- `prefers-reduced-motion`: disable pulse animation
- iOS Safari: Web Speech API has limited support—detect and hide mic with graceful fallback message

---

## Testing

| Test | Location |
|------|----------|
| Unit: `useSpeechRecognition` state machine + error mapping | `tests/unit/useSpeechRecognition.test.ts` (mock SpeechRecognition) |
| Unit: `parseChatMessageBody` with knowledge chunks | extend existing chat message tests |
| Unit: `extractKnowledgeFromToolResult` in agent | `tests/int/aiSearch.int.spec.ts` |
| Integration: assistant returns knowledgeChunks for policy query | `tests/int/aiSearch.int.spec.ts` |
| E2E: mic button visible, click doesn't break form (mock SpeechRecognition in Playwright) | extend [`tests/e2e/chat.e2e.spec.ts`](tests/e2e/chat.e2e.spec.ts) |

---

## File Change Summary

| File | Change |
|------|--------|
| `src/hooks/useSpeechRecognition.ts` | **New** — Web Speech API hook |
| `src/components/chat/VoiceInputButton.tsx` | **New** — mic UI + states |
| `src/components/chat/VoiceStatusBar.tsx` | **New** — listening feedback |
| `src/components/chat/ChatComposer.tsx` | **New** — shared textarea + mic + send |
| `src/components/chat/ChatPanel.tsx` | Use `ChatComposer` |
| `src/components/ai-search/AiSearchExperience.tsx` | Use `ChatComposer`; pass `knowledgeChunks` from assistant |
| `src/components/chat/ChatMessageBubble.tsx` | Render `KnowledgeResults` |
| `src/lib/ai/agent.ts` | Collect + return `knowledgeChunks` |
| `src/lib/ai/tools.ts` + `executeTool.ts` | Add `listActivePromoCodes` |
| `src/lib/ai/systemPrompt.ts` | Voice + coupon routing hints |
| `src/lib/chat/productMessage.ts` | Rich message encoding |
| `src/lib/chat/types.ts` | Add `knowledgeChunks` to DTO |
| `src/lib/ai/chatAssistant.ts` | Encode knowledge in persisted messages |
| `next.config.ts` | Allow `microphone=(self)` |

---

## Deferred (post-MVP)

- LLM response streaming (`callLlmChat` currently `stream: false`)
- Candidate/biodata cards (no collection exists)
- Seller search (no collection exists)
- Cloud STT fallback (Whisper/Deepgram) for Safari
- Full `promo-codes` RAG indexing
- Auto-submit toggle (can add later to `ChatComposer` props)
