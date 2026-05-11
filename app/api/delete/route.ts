import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, imageUrl } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Verify ownership before deleting
    const { data: gen, error: fetchError } = await supabase
      .from("generations")
      .select("id, image_url, clerk_id")
      .eq("id", id)
      .eq("clerk_id", userId)
      .single();

    if (fetchError || !gen) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete from Storage if it's a Supabase URL
    const url = imageUrl || gen.image_url;
    if (url && url.includes("supabase")) {
      try {
        // Extract file path from public URL
        // URL format: .../storage/v1/object/public/generations/{userId}/{filename}
        const match = url.match(/\/generations\/(.+)$/);
        if (match) {
          await supabase.storage.from("generations").remove([match[1]]);
        }
      } catch (storageErr) {
        console.error("Storage delete error:", storageErr);
        // Continue — still delete from DB
      }
    }

    // Delete from DB
    const { error: deleteError } = await supabase
      .from("generations")
      .delete()
      .eq("id", id)
      .eq("clerk_id", userId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error deleting generation:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
