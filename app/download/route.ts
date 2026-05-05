? "Flux 2 (flux-2-trainer-v2)"
: "Flux 1 (flux-lora-fast-training)";

    // Force convert to raw pixels first, then to JPEG
    // This handles any input format (WebP, PNG, JPEG) from fal.ai
    const processedImage = await sharp(imageBuffer)
    const processedBuffer = await sharp(imageBuffer)
.toFormat("jpeg", { quality: 95 })
.withExif({
IFD0: {
Copyright: `© Kellogg Company ${now.getFullYear()}. Tony the Tiger® All Rights Reserved.`,
Artist: "Toni Generator — AI Character Studio",
Software: `Toni Generator v1.0 | ${modelLabel} | ${aspectRatio} | ${dateStr}`,
          ImageDescription: scene
            ? scene.slice(0, 200)
            : "AI-generated Tony the Tiger scene",
          ImageDescription: scene ? scene.slice(0, 200) : "AI-generated Tony the Tiger scene",
},
})
.toBuffer();

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const processedImage = new Uint8Array(processedBuffer);

const filename = `toni-${dateStr}-${Date.now()}.jpg`;

return new NextResponse(processedImage, {
headers: {
"Content-Type": "image/jpeg",
"Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": processedImage.length.toString(),
        "Content-Length": processedImage.byteLength.toString(),
},
});
} catch (error) {
