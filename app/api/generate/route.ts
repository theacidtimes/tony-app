import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";

fal.config({ credentials: process.env.FAL_KEY });

const LORA_URL = "https://v3b.fal.media/files/b/0a98d078/VSndQkT1DNNOV_vYNcUZC_pytorch_lora_weights.safetensors";

const CHARACTER = "an anthropomorphic tiger mascot, orange fur with black stripes, red bandana around neck, white belly fur, round black-tipped ears, blue nose, yellow expressive eyes, athletic bipedal build";

const BEHAVIOR = "Confident, energetic, charismatic. Natural expression, subtle asymmetry. Eyes engaged, never empty. Relaxed, grounded posture. Athletic, physically believable movement. No stiffness, no overacting, no cartoon behavior.";

const CHARACTER_LOCK = "CHARACTER LOCK: Strict fidelity to original tiger reference — exact stripe patterns, fur texture and direction, facial structure and proportions, silhouette consistency.";

const RULES = "Style: Hyper-realistic editorial photography. No CGI, no cartoon, no stylization. Light: Soft diffused ambient light, natural shadow falloff, subtle grain, balanced exposure.";

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

    // Estrutura próxima ao workflow do Weave
    const fullPrompt = [
      `The scene: ${CHARACTER}, ${refinedPrompt}`,
      cameraAngle ? `The camera angle: ${cameraAngle}.` : "",
      BEHAVIOR,
      CHARACTER_LOCK,
      RULES,
    ].filter(Boolean).join(" ");

    const result = await fal.subscribe("fal-ai/flux-2/lora", {
      input: {
        prompt: fullPrompt,
        loras: [{ path: LORA_URL, scale: 0.9 }],
        image_size: dimensions,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
      },
    });

    const data = result.data as { images?: Array<{ url: string }> };
    const imageUrl = data?.images?.[0]?.url;

    if (!imageUrl) {
      console.error("No image URL in result:", JSON.stringify(result));
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error generating image:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
