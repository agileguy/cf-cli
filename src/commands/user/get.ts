import type { Context, User } from "../../types/index.js";

export async function run(_args: string[], ctx: Context): Promise<void> {
  const user = await ctx.client.get<User>("/user");

  ctx.output.detail({
    "ID": user.id,
    "Email": user.email,
    "Username": user.username,
    "First Name": user.first_name ?? "-",
    "Last Name": user.last_name ?? "-",
    "Telephone": user.telephone ?? "-",
    "Country": user.country ?? "-",
    "Zipcode": user.zipcode ?? "-",
    "2FA Enabled": user.two_factor_authentication_enabled,
    "Suspended": user.suspended,
    "Created": user.created_on,
    "Modified": user.modified_on,
  });
}
