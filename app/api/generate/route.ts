import { fal } from "@fal-ai/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getMonthlyUsage, logGeneration, getOrCreateUser } from "@/lib/supabase";
import { PLANS, PlanType } from "@/lib/plans";
import { currentUser } from "@clerk/nextjs/server";

fal.config({ credentials: process.env.FAL_KEY });

const LORA_FLUX1_URL = "https://v3b.fal.media/files/b/0a98df64/eQMXIQDgmJv2T3BrX0Yun_pytorch_lora_weights.safetensors";
const LORA_FLUX2_URL = "https://v3b.fal.media/files/b/0a98e908/VudC9BEhFrinJbfn9dR9B_pytorch_lora_weights.safetensors";

const CHARACTER = "TONI_TIGER character, an anthropomorphic tiger mascot, orange fur with black stripes, red bandana around neck, white belly fur, round black-tipped ears, blue nose, yellow expressive eyes, athletic bipedal build, exactly 2 whiskers per side of the face, no more no less";
const BEHAVIOR = "Confident, energetic, charismatic. Natural expression, subtle asymmetry. Eyes engaged, never empty. Relaxed, grounded posture. Athletic, physically believable movement. No stiffness, no overacting, no cartoon behavior.";
const CHARACTER_LOCK = "Strict fidelity to original tiger reference — exact stripe patterns, fur texture and direction, facial structure and proportions, silhouette consistency. WHISKERS: strictly 2 whiskers per side, no exceptions.";
const ANATOMY = "Real tiger anatomy only. No human traits, no added joints, no altered limbs. Face: exactly 2 whiskers per side, precisely symmetrical placement, thin and sharp.";
const RULES = "Style: Hyper-realistic editorial photography. No CGI, no cartoon, no stylization. Light: Soft diffused ambient light, natural shadow falloff, subtle grain, balanced exposure.";

const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 1024, height: 1280 },
  "9:16": { width: 864, height: 1536 },
  "16:9": { width: 1536, height: 864 },
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { refinedPrompt, aspectRatio, model, scene } = await request.json();

    if (!refinedPrompt) {
      return NextResponse.json({ error: "Refined prompt is required" }, { status: 400 });
    }

    // Check monthly limit
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || "";
    const name = user?.fullName || user?.firstName || email;
    const dbUser = await getOrCreateUser(userId, email, name);
    const plan = (dbUser?.plan || "enterprise") as PlanType;
    const limit = PLANS[plan]?.monthlyLimit || 1000;
    const used = await getMonthlyUsage(userId);

    if (used >= limit) {
      return NextResponse.json({ error: "Monthly limit reached. Please upgrade your plan." }, { status: 429 });
    }

    const dimensions = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS["1:1"];
    const fullPrompt = [
      `${CHARACTER}, ${refinedPrompt}`,
      BEHAVIOR,
      CHARACTER_LOCK,
      ANATOMY,
      RULES,
    ].join(" ");

    let imageUrl: string | undefined;

    if (model === "flux2") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (fal.subscribe as any)("fal-ai/flux-2/lora", {
        input: {
          prompt: fullPrompt,
          loras: [{ path: LORA_FLUX2_URL, scale: 1.0 }],
          image_size: dimensions,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
        },
      });
      imageUrl = result?.data?.images?.[0]?.url || result?.images?.[0]?.url;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (fal.subscribe as any)("fal-ai/flux-lora", {
        input: {
          prompt: fullPrompt,
          loras: [{ path: LORA_FLUX1_URL, scale: 1.0 }],
          image_size: dimensions,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: false,
        },
      });
      imageUrl = result?.data?.images?.[0]?.url || result?.images?.[0]?.url;
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    // Log generation in Supabase
    await logGeneration(userId, model || "flux2", scene || "");

    return NextResponse.json({ imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error generating image:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
