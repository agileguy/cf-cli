import type { Context } from "../../../types/index.js";
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

  const body: Record<string, unknown> = {};
  const defaultStorageClass = getStringFlag(flags, "defaultStorageClass");
  if (defaultStorageClass) body["storageClass"] = defaultStorageClass;

  if (Object.keys(body).length === 0) {
    throw new UsageError("Provide at least one update flag (e.g. --default-storage-class).");
  }

  await ctx.client.patch<void>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(name)}`,
    body,
  );

  ctx.output.success(`R2 bucket "${name}" updated.`);
}
