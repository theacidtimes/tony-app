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
    const modelLabel = model === "flux2" ? "Flux 2 (flux-2-trainer-v2)" : "Flux 1 (flux-lora-fast-training)";

    const xmpData = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.adobe.com/dc/elements/1.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
      xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">Tony the Tiger — AI Generated Scene</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>Toni Generator — AI Character Studio</rdf:li></rdf:Seq></dc:creator>
      <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">© Kellogg Company. All rights reserved. Tony the Tiger® is a registered trademark of Kellogg Company.</rdf:li></rdf:Alt></dc:rights>
      <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${scene ? scene.replace(/[<>&"]/g, (c: string) => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]||c)) : "AI-generated character scene"}</rdf:li></rdf:Alt></dc:description>
      <xmp:CreateDate>${now.toISOString()}</xmp:CreateDate>
      <xmp:CreatorTool>Toni Generator v1.0</xmp:CreatorTool>
      <xmpRights:Marked>True</xmpRights:Marked>
      <xmpRights:UsageTerms><rdf:Alt><rdf:li xml:lang="x-default">Authorized use only. Property of Kellogg Company.</rdf:li></rdf:Alt></xmpRights:UsageTerms>
      <Iptc4xmpCore:CopyrightNotice>© Kellogg Company ${now.getFullYear()}. Tony the Tiger® All Rights Reserved.</Iptc4xmpCore:CopyrightNotice>
      <Iptc4xmpCore:CreatorContactInfo>
        <rdf:Description>
          <Iptc4xmpCore:CiAdrCity>Battle Creek</Iptc4xmpCore:CiAdrCity>
          <Iptc4xmpCore:CiAdrCtry>US</Iptc4xmpCore:CiAdrCtry>
          <Iptc4xmpCore:CiUrlWork>https://www.kelloggs.com</Iptc4xmpCore:CiUrlWork>
        </rdf:Description>
      </Iptc4xmpCore:CreatorContactInfo>
      <Iptc4xmpCore:IntellectualGenre>AI Generated — Model: ${modelLabel} — Format: ${aspectRatio} — Date: ${dateStr}</Iptc4xmpCore:IntellectualGenre>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

    const processedImage = await sharp(imageBuffer)
      .withExif({
        IFD0: {
          Copyright: `© Kellogg Company ${now.getFullYear()}. Tony the Tiger® All Rights Reserved.`,
          Artist: "Toni Generator — AI Character Studio",
          Software: "Toni Generator v1.0 | Model: " + modelLabel,
          ImageDescription: scene ? scene.slice(0, 200) : "AI-generated Tony the Tiger scene",
        },
      })
      .withIccProfile("srgb")
      .jpeg({ quality: 95 })
      .toBuffer();

    const xmpBuffer = Buffer.from(xmpData, "utf-8");
    const xmpHeader = Buffer.from("http://ns.adobe.com/xap/1.0/\0", "utf-8");
    const xmpMarker = Buffer.from([0xff, 0xe1]);
    const xmpLength = Buffer.alloc(2);
    xmpLength.writeUInt16BE(xmpHeader.length + xmpBuffer.length + 2, 0);
    const xmpChunk = Buffer.concat([xmpMarker, xmpLength, xmpHeader, xmpBuffer]);

    const soi = processedImage.slice(0, 2);
    const rest = processedImage.slice(2);
    const finalImage = Buffer.concat([soi, xmpChunk, rest]);

    const filename = `toni-${dateStr}-${Date.now()}.jpg`;

    return new NextResponse(finalImage, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": finalImage.length.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error processing image:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
