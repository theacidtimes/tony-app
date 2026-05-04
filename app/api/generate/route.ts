import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";

fal.config({ credentials: process.env.FAL_KEY });

const LORA_URL = "https://v3b.fal.media/files/b/0a98d078/VSndQkT1DNNOV_vYNcUZC_pytorch_lora_weights.safetensors";

const BEHAVIOR = "Confident, energetic, charismatic. Natural expression, subtle asymmetry. Eyes engaged, never empty. Relaxed, grounded posture. Athletic, physically believable movement. No stiffness, no overacting, no cartoon behavior.";

const CHARACTER_LOCK = "TONI_TIGER character. Strict fidelity to original tiger reference: exact stripe patterns, fur texture and direction, facial structure and proportions, silhouette consistency.";

const ANATOMY = "Real tiger anatomy only. No human traits, no added joints, no altered limbs.";

const WHISKERS = "Exactly 2 whiskers per side. No duplication or variation.";

const RULES_OF_PROMPTING = "Style: Hyper-realistic editorial photography. No CGI, no cartoon, no stylization. Light: Soft diffused ambient light. Natural shadow falloff. Subtle grain, balanced exposure.";

const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 1024, height: 1280 },
  "9:16": { width: 864, height: 1536 },
  "16:9": { width: 1536, height: 864 },
};

export async function POST(request: Request) {
  try {
    const { refinedPrompt, cameraAngle, aspectRatio } = await request.json();

    if (!refinedPrompt) {
      return NextResponse.json({ error: "Refined prompt is required" }, { status: 400 });
    }

    const dimensions = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS["1:1"];

    const fullPrompt = `TONI_TIGER, ${refinedPrompt}. ${cameraAngle ? `Camera: ${cameraAngle}.` : ""} ${BEHAVIOR} ${CHARACTER_LOCK} ${ANATOMY} ${WHISKERS} ${RULES_OF_PROMPTING}`;

    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt: fullPrompt,
        loras: [{ path: LORA_URL, scale: 1.0 }],
        image_size: dimensions,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: false,
      },
    }) as unknown as { images: Array<{ url: string }> };

    const imageUrl = result.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
