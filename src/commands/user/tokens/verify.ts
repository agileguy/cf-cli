import type { Context, TokenVerifyResult } from "../../../types/index.js";

export async function run(_args: string[], ctx: Context): Promise<void> {
  const result = await ctx.client.get<TokenVerifyResult>("/user/tokens/verify");

  ctx.output.detail({
    "ID": result.id,
    "Status": result.status,
    "Not Before": result.not_before ?? "-",
    "Expires On": result.expires_on ?? "never",
  });
}
