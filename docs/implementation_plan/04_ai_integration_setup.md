# Implementation Plan 04: AI Integration Setup

> **Phase**: 4 — AI Integration Setup  
> **Priority**: 🟡 High  
> **Estimated Effort**: ~1 hour

---

## Objective

Set up the OpenAI SDK and create two reusable AI service functions: one for generating 1536-dimensional text embeddings, and one for cleaning up/formatting raw note content using an LLM.

---

## Steps

### 4.1 — Install OpenAI SDK
```bash
npm install openai
```

### 4.2 — Create AI Service Module

**File**: `src/services/ai.ts`

```ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});
```

### 4.3 — Implement `generateEmbedding`

```ts
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding; // 1536-dimensional vector
}
```

**Key details:**
- Model: `text-embedding-3-small` — produces 1536 dimensions.
- Returns a plain `number[]` that maps directly to the `VECTOR(1536)` column in Supabase.

### 4.4 — Implement `cleanupNoteContent`

```ts
export async function cleanupNoteContent(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Format the following messy text into a clean, logical, bulleted outline. Output only the formatted text, no conversational filler.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });
  return response.choices[0].message.content ?? text;
}
```

**Key details:**
- Model: `gpt-4o-mini` — fast and cheap for formatting tasks.
- System prompt explicitly constrains the output to formatted text only.
- Falls back to original text if the response is null.

---

## Verification

- [ ] `npx tsc --noEmit` passes with zero errors on `src/services/ai.ts`.
- [ ] Manually test `generateEmbedding("hello world")` returns an array of length 1536 (can use a temp script or REPL).
- [ ] Manually test `cleanupNoteContent("messy text here blah stuff")` returns a clean bulleted outline.

> [!NOTE]
> AI functions require a valid `EXPO_PUBLIC_OPENAI_API_KEY` in `.env` to test. Ensure the key is set before verification.

---

## Dependencies

- **Upstream**: Plan 01 (environment & `.env`).
- **Downstream**: Plan 06 (Capture screen calls `generateEmbedding`), Plan 08 (Detail View calls `cleanupNoteContent`).
