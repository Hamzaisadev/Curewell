# 0006. Bilingual Clinical Co-Pilot Voice Telemetry and Bidirectional Typography

We decided to establish native bilingual support (Urdu script and English) across Shifa AI's voice telemetry, conversational RAG intent routing, bidirectional (BiDi) markdown rendering, and typographical line-height budgets.

## Context

Curewell's primary patient demographic in Pakistan and South Asia routinely converses, articulates symptoms, and reads medical advice in Urdu or mixed Urdu-English (Hindustani vernacular), while pharmaceutical packaging, lab units (mg/dL, mmol/L), and brand names (e.g., Panadol 500mg, Glucophage 850mg) remain in Latin English script.

The previous Shifa AI implementation suffered from four major architectural failures:
1. **Monolingual Voice Pipeline**: Both Web Speech API dictation (`SpeechRecognition.lang = 'en-US'`) and synthesis (`SpeechSynthesisUtterance.lang = 'en-US'`) were hardcoded to US English. Urdu dictation was garbled into nonsensical English words, while English TTS either muted or mispronounced Urdu text.
2. **Premature Silence Truncation & Chrome TTS Stalling**: `continuous = false` terminated recording upon a 800ms hesitation, while Chromium's garbage collection bug stalled synthesis audio after 15 seconds.
3. **BiDi Text Mangling & LTR Misalignment**: Urdu paragraphs were rendered without `dir="auto"`, bullet lists used hardcoded left padding (`pl-5`) detaching bullet markers across the screen from right-aligned Urdu text, and ASCII-only regex (`[^\w\s-]`) erased all Urdu characters when auto-generating chat session titles.
4. **English-Only RAG Retrieval**: Intent gating in `executeClinicalRag()` checked only English keywords (`glucose`, `interact`, `food`), leaving Urdu queries defaulting to unspecialized general handling.

## Decision

1. **Dual-Mode Voice Telemetry**:
   - Provide an explicit language toggle (`EN` / `UR`) with intelligent auto-detection based on the input text.
   - Configure speech recognition with `lang: 'ur-PK'` for Urdu and `lang: 'en-US'` (or `'en-PK'`) for English, with `continuous: true` and an inactivity debounce timer (3 seconds) to tolerate natural clinical speech pauses.
   - For speech synthesis, inspect text script (`/[\u0600-\u06FF]/`): if Urdu script is present, select an Urdu (`ur`, `ur-PK`) or South Asian voice (`hi-IN` fallback) with `lang: 'ur-PK'`; otherwise use English.
   - Implement a recurring 14-second `pause()` / `resume()` keep-alive loop to prevent Chromium V8 garbage collection stalling.
   - Suppress false-alarm toasts for benign browser speech events (`no-speech`, `aborted`).

2. **Bidirectional Typography & Nastaliq Font Architecture**:
   - Inject `dir="auto"` and logical padding (`ps-5` instead of `pl-5`) into all markdown blocks, list items, and paragraph tags in `ChatMessageRenderer`.
   - Wrap embedded Latin pharmaceutical names, dosages, and numerical lab values in `<bdi>` (bidirectional isolation) elements or CSS unicode-bidi boundaries to prevent punctuation inversion and word scrambling.
   - Upgrade typography tokens to include Urdu-capable font stacks (`'Noto Nastaliq Urdu', 'Gulzar', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', system-ui`) and dynamically apply relaxed line-heights (`leading-[1.9]` to `leading-[2.2]`) for Urdu blocks to prevent clipping of nuqtas (dots) and kashidas.
   - Upgrade chat title sanitization regex to Unicode-aware property escapes (`/[^\p{L}\p{N}\s-]/gu`) so Urdu session titles are preserved.

3. **Bilingual RAG Intent Corpus**:
   - Expand `api/_lib/rag/retrieval.ts` keyword dictionaries with canonical Urdu and Roman Urdu clinical terms for blood pressure (`بلڈ پریشر`, `خون کا دباؤ`, `bp`), blood sugar (`شوگر`, `ذیابیطس`, `glucose`), timing (`خالی پیٹ`, `کھانے کے بعد`), interactions (`ایک ساتھ`, `نقصان`), and surgical pre-op (`آپریشن`, `سرجری`).
   - Instruct Gemini in `api/chat-assistant.ts` to output follow-up `suggestions` in the exact language of the user's inquiry (Urdu suggestions for Urdu queries, English for English).

4. **Ergonomic Composer & Safety Guarantees**:
   - Replace the single-line `<input>` with an auto-expanding `<textarea>` (supporting `Enter` to submit, `Shift+Enter` for newline).
   - Require an explicit confirmation step before deleting a chat session from the main header.
   - Automatically close the navigation drawer on mobile viewports when a patient selects an existing session.
   - Retain draft text and attached images if a network error occurs during submission.

## Consequences

- Patients can dictate and listen to medical consultations fluidly in Urdu or English without device misinterpretation.
- Urdu clinical guidance reads naturally with proper right-to-left layout, clear list alignment, and intact punctuation even when co-occurring with English medicine names.
- RAG correctly routes Urdu inquiries to specific clinical safety and biomarker databases.
- Chat session titles in Urdu are properly preserved in history.
- Accidental session data loss is eliminated through delete confirmation and draft preservation.
