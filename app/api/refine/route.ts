import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a prompt engineer for a character-consistent image generation system featuring an anthropomorphic tiger mascot.

Your job is to take a simple scene description — written in any language, including Portuguese — and expand it into a rich, detailed image prompt in English.

STRUCTURE YOUR OUTPUT exactly like this (one flowing paragraph, not bullet points):

Start with the scene: describe the environment, action, and atmosphere in vivid detail. Include lighting conditions naturally. Add emotional energy and movement. Then describe what the character is doing with specificity — posture, expression, interaction with the environment.

RULES:
- Always write in English regardless of input language
- Expand the scene with rich environmental details, lighting, and atmosphere
- Describe the character's action and emotional state specifically
- Keep it grounded and cinematic — editorial photography tone
- Include specific clothing or accessories if mentioned
- 2-4 sentences maximum, dense and precise

DO NOT:
- Mention camera angles or lenses (handled separately)
- Describe the character's base appearance (handled separately)
- Add unrelated elements not implied by the scene
- Use generic filler phrases like "capturing the essence of"
- Write bullet points or lists

OUTPUT: A single flowing paragraph in English, ready to complete a larger prompt.`;

export async function POST(request: Request) {
  try {
    const { scene } = await request.json();

    if (!scene || scene.trim().length === 0) {
      return NextResponse.json({ error: "Scene description is required" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
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
