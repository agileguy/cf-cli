import type { Context, R2Bucket } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <bucket-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const bucket = await ctx.client.get<R2Bucket>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(name)}`,
  );

  ctx.output.detail({
    "Name": bucket.name,
    "Location": bucket.location ?? "(default)",
    "Storage Class": bucket.storage_class ?? "Standard",
    "Created": bucket.creation_date,
  });
}
