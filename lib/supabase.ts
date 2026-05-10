import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function getOrCreateUser(clerkUserId: string, email: string, name: string) {
  if (!supabase) return { plan: "enterprise" };

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerkUserId)
    .single();

  if (existing) return existing;

  const { data: created } = await supabase
    .from("users")
    .insert({ clerk_id: clerkUserId, email, name, plan: "enterprise" })
    .select()
    .single();

  return created || { plan: "enterprise" };
}

export async function getMonthlyUsage(clerkUserId: string): Promise<number> {
  if (!supabase) return 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("clerk_id", clerkUserId)
    .gte("created_at", startOfMonth.toISOString());

  return count || 0;
}

export async function logGeneration(clerkUserId: string, model: string, scene: string) {
  if (!supabase) return;
  await supabase
    .from("generations")
    .insert({ clerk_id: clerkUserId, model, scene });
}
