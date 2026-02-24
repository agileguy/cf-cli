import type { Context, R2CustomDomain } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const bucket = getStringFlag(flags, "bucket");
  if (!bucket) throw new UsageError("--bucket <name> is required.");

  const domain = getStringFlag(flags, "domain");
  if (!domain) throw new UsageError("--domain <domain> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = { domain };
  const zoneId = getStringFlag(flags, "zoneId");
  if (zoneId) body["zoneId"] = zoneId;

  const result = await ctx.client.post<R2CustomDomain>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(bucket)}/custom_domains`,
    body,
  );

  ctx.output.success(`Custom domain "${result.domain}" added to bucket "${bucket}".`);
}
