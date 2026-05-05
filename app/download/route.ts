import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const { imageUrl, scene, model, aspectRatio } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const modelLabel = model === "flux2"
      ? "Flux 2 (flux-2-trainer-v2)"
      : "Flux 1 (flux-lora-fast-training)";

    // Force convert to raw pixels first, then to JPEG
    // This handles any input format (WebP, PNG, JPEG) from fal.ai
    const processedImage = await sharp(imageBuffer)
      .toFormat("jpeg", { quality: 95 })
      .withExif({
        IFD0: {
          Copyright: `© Kellogg Company ${now.getFullYear()}. Tony the Tiger® All Rights Reserved.`,
          Artist: "Toni Generator — AI Character Studio",
          Software: `Toni Generator v1.0 | ${modelLabel} | ${aspectRatio} | ${dateStr}`,
          ImageDescription: scene
            ? scene.slice(0, 200)
            : "AI-generated Tony the Tiger scene",
        },
      })
      .toBuffer();

    const filename = `toni-${dateStr}-${Date.now()}.jpg`;

    return new NextResponse(processedImage, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": processedImage.length.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error processing image:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
