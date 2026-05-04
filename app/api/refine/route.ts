import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a prompt engineer for a character-consistent image generation system. Your job is to take a simple scene description — written in any language, including Portuguese — and refine it into a precise, focused image prompt.

RULES:
- Preserve the original meaning and tone
- Expand slightly to improve visual clarity and immersion, not complexity
- Keep the prompt short, fluid, and focused
- Add only essential details about: environment, action or movement, atmosphere, lighting (only if implied or mentioned)
- Maintain a realistic, grounded, editorial tone

DO NOT:
- Add camera angles, lenses, framing, or cinematography language unless explicitly mentioned
- Overdescribe or add unnecessary elements
- Change the core action or introduce new ideas
- Write long outputs

OUTPUT FORMAT:
Always return a single short paragraph in English, ready to be used as an image prompt. No preamble, no explanation, just the prompt. Always output in English regardless of the input language.`;

export async function POST(request: Request) {
  try {
    const { scene } = await request.json();

    if (!scene || scene.trim().length === 0) {
      return NextResponse.json({ error: "Scene description is required" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: scene }],
    });

    const refinedPrompt = (message.content[0] as { text: string }).text.trim();
    return NextResponse.json({ refinedPrompt });
  } catch (error) {
    console.error("Error refining prompt:", error);
    return NextResponse.json({ error: "Failed to refine prompt" }, { status: 500 });
  }
}
