import type { Context, BillingProfile } from "../../../types/index.js";

export async function run(_args: string[], ctx: Context): Promise<void> {
  const profile = await ctx.client.get<BillingProfile>("/user/billing/profile");

  ctx.output.detail({
    "ID": profile.id ?? "-",
    "Name": [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "-",
    "Company": profile.company ?? "-",
    "Address": profile.address ?? "-",
    "City": profile.city ?? "-",
    "State": profile.state ?? "-",
    "Zipcode": profile.zipcode ?? "-",
    "Country": profile.country ?? "-",
    "Telephone": profile.telephone ?? "-",
    "Card": profile.card_number ?? "-",
    "Payment Gateway": profile.payment_gateway ?? "-",
    "Payment Email": profile.payment_email ?? "-",
    "Type": profile.type ?? "-",
    "Created": profile.created_on ?? "-",
  });
}
