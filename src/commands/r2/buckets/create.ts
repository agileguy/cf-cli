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

  const body: Record<string, unknown> = { name };
  const location = getStringFlag(flags, "location");
  if (location) body["locationHint"] = location;
  const storageClass = getStringFlag(flags, "storageClass");
  if (storageClass) body["storageClass"] = storageClass;

  const bucket = await ctx.client.post<R2Bucket>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets`,
    body,
  );

  ctx.output.success(`R2 bucket "${bucket.name}" created.`);
}
