export const PLANS = {
  starter: {
    name: "Starter",
    monthlyLimit: 200,
    maxUsers: 1,
    price: 299,
  },
  pro: {
    name: "Pro",
    monthlyLimit: 600,
    maxUsers: 3,
    price: 699,
  },
  enterprise: {
    name: "Enterprise",
    monthlyLimit: 1000,
    maxUsers: 10,
    price: 1499,
  },
  admin: {
    name: "Admin",
    monthlyLimit: 999999,
    maxUsers: 999,
    price: 0,
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanColor(used: number, limit: number): string {
  const pct = used / limit;
  if (pct >= 0.9) return "#ff6b6b";
  if (pct >= 0.7) return "#FF6B00";
  return "#2DCA72";
}

export function getPlanLabel(used: number, limit: number): string {
  const pct = used / limit;
  if (pct >= 0.9) return "critical";
  if (pct >= 0.7) return "moderate";
  return "healthy";
}
