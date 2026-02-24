import type { Context, StreamSigningKey } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const key = await ctx.client.post<StreamSigningKey>(
    `/accounts/${encodeURIComponent(accountId)}/stream/keys`,
  );

  ctx.output.detail({
    "ID": key.id,
    "PEM": key.pem ?? "-",
    "JWK": key.jwk ?? "-",
    "Created": key.created ?? "-",
  });
  ctx.output.success(`Signing key created: ${key.id}`);
}
