import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

fal.config({ credentials: process.env.FAL_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TONI_REFS = [
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927596/closeup_frontal_normal_twkbjk.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927596/closeup_profile_shot_normal_oajbg2.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927595/closeup_frontal_subtlesmile_dhrihu.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927593/fullbody_open_arms_hzwenr.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/v1777927594/fullbody_open_arms_profile_palm_down_sbobuh.png",
  "https://res.cloudinary.com/dgq1pj4hb/image/upload/q_auto/f_auto/v1777927593/fullbody_open_arms_back_xdkadd.png",
];

const REFINE_PROMPT = `Using the last images as character references, refine the tiger character in the first image. Preserve everything about the scene: environment, background, lighting, atmosphere, camera angle, body posture, acting and pose. Only correct the character so it matches the references in both face and full body: facial structure, head shape, muzzle, blue nose, yellow eyes, exactly 2 whiskers per side, stripe patterns, red bandana, white belly fur, torso proportions, athletic rounded body shape, arm thickness, leg proportions, paw size, four-finger hands, feet shape, tail shape, posture anatomy and overall silhouette.`;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, scene } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const image_urls = [imageUrl, ...TONI_REFS];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)("fal-ai/nano-banana-2/edit", {
      input: {
        prompt: REFINE_PROMPT,
        image_urls,
      },
    });

    const falRefinedUrl =
      result?.data?.images?.[0]?.url ||
      result?.images?.[0]?.url ||
      result?.data?.image?.url ||
      result?.image?.url;

    if (!falRefinedUrl) {
      console.error("No refined image URL:", JSON.stringify(result).slice(0, 300));
      return NextResponse.json({ error: "No image returned from refiner" }, { status: 500 });
    }

    // — Upload para Supabase Storage —
    let refinedUrl = falRefinedUrl;
    try {
      const imageResponse = await fetch(falRefinedUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBytes = new Uint8Array(imageBuffer);

      const fileName = `${userId}/${Date.now()}_nb.webp`;

      const { error: uploadError } = await supabase.storage
        .from("generations")
        .upload(fileName, imageBytes, {
          contentType: "image/webp",
          upsert: false,
        });

      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from("generations")
          .getPublicUrl(fileName);
        refinedUrl = publicData.publicUrl;
      } else {
        console.error("Storage upload error:", uploadError.message);
      }
    } catch (storageErr) {
      console.error("Storage error (fallback to fal URL):", storageErr);
    }

    // — Log no Supabase —
    try {
      await supabase.from("generations").insert({
        clerk_id: userId,
        model: "nano",
        scene: scene || "refined",
        image_url: refinedUrl,
      });
    } catch (dbErr) {
      console.error("DB log error:", dbErr);
    }

    return NextResponse.json({ imageUrl: refinedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error refining character:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
