import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);
    const filename = `toni-${Date.now()}.jpg`;

    return new NextResponse(imageData, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": imageData.byteLength.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error downloading image:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
