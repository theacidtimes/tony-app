import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("generations")
      .select("id, model, scene, image_url, created_at")
      .eq("clerk_id", userId)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error fetching generations:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
