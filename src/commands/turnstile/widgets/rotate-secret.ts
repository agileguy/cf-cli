import type { Context, TurnstileRotateSecretResult } from "../../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const sitekey = getStringFlag(flags, "sitekey");
  if (!sitekey) throw new UsageError("--sitekey <key> is required.");

  const invalidateImmediately = getBoolFlag(flags, "invalidateImmediately");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {};
  if (invalidateImmediately) {
    body["invalidate_immediately"] = true;
  }

  const result = await ctx.client.post<TurnstileRotateSecretResult>(
    `/accounts/${encodeURIComponent(accountId)}/challenges/widgets/${encodeURIComponent(sitekey)}/rotate_secret`,
    body,
  );

  ctx.output.success(`Secret rotated for widget "${sitekey}".`);
  ctx.output.detail({
    "Sitekey": result.sitekey,
    "New Secret": result.secret,
  });
}
