import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Generate a 1536-dimensional embedding vector for the given text.
 * Uses OpenAI's text-embedding-3-small model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Clean up messy note content into a formatted bulleted outline.
 * Uses OpenAI's gpt-4o-mini model.
 */
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
