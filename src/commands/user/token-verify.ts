import type { Context, TokenVerifyResult } from "../../types/index.js";

export async function run(_args: string[], ctx: Context): Promise<void> {
  const result = await ctx.client.get<TokenVerifyResult>(
    "/user/tokens/verify",
  );

  ctx.output.detail({
    "Token ID": result.id,
    "Status": result.status,
    "Not Before": result.not_before ?? "-",
    "Expires On": result.expires_on ?? "-",
  });

  if (result.status === "active") {
    ctx.output.success("Token is valid and active.");
  } else {
    ctx.output.warn(`Token status: ${result.status}`);
  }
}
