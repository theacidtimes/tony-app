import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUser, getMonthlyUsage } from "@/lib/supabase";
import { PLANS, PlanType } from "@/lib/plans";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || "";
    const name = user?.fullName || user?.firstName || email;

    // Garante que o usuário existe no Supabase
    const dbUser = await getOrCreateUser(userId, email, name);
    const plan = (dbUser?.plan || "enterprise") as PlanType;
    const limit = PLANS[plan]?.monthlyLimit || 1000;
    const used = await getMonthlyUsage(userId);

    return NextResponse.json({
      userId,
      name,
      email,
      plan,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      percentage: Math.min(100, Math.round((used / limit) * 100)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
