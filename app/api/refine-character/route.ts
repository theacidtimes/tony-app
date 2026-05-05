import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";

fal.config({ credentials: process.env.FAL_KEY });

const TONI_REFS = [
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927596/closeup_frontal_normal_twkbjk.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927596/closeup_profile_shot_normal_oajbg2.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927595/closeup_frontal_subtlesmile_dhrihu.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927593/fullbody_open_arms_hzwenr.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927594/fullbody_open_arms_profile_palm_down_sbobuh.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/q_auto/f_auto/v1777927593/fullbody_open_arms_back_xdkadd.png",
];

const REFINE_PROMPT = `Using the last images as character references, refine the tiger character in the first image. Preserve everything about the scene: environment, background, lighting, atmosphere, camera angle, body posture, acting and pose. Only correct the character to match the references: facial structure, exactly 2 whiskers per side, stripe patterns, blue nose, four finger hands, yellow eyes, red bandana, white belly fur, silhouette. Do not change the scene or background.`;

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    // First image is the one to edit, remaining are character references
    const image_urls = [imageUrl, ...TONI_REFS];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)("fal-ai/nano-banana-2/edit", {
      input: {
        prompt: REFINE_PROMPT,
        image_urls,
      },
    });

    const refinedUrl =
      result?.data?.images?.[0]?.url ||
      result?.images?.[0]?.url ||
      result?.data?.image?.url ||
      result?.image?.url;

    if (!refinedUrl) {
      console.error("No refined image URL:", JSON.stringify(result).slice(0, 300));
      return NextResponse.json({ error: "No image returned from refiner" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: refinedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error refining character:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
