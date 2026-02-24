import type { Context, CFImageSigningKey } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const key = await ctx.client.post<CFImageSigningKey>(
    `/accounts/${encodeURIComponent(accountId)}/images/v1/keys`,
  );

  ctx.output.detail({
    "Name": key.name,
    "Value": key.value ?? "-",
  });
  ctx.output.success(`Signing key created: ${key.name}`);
}
