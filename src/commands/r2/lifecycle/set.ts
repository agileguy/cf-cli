import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const bucket = getStringFlag(flags, "bucket");
  if (!bucket) throw new UsageError("--bucket <name> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <lifecycle-json> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let lifecycleRules: unknown;
  try {
    lifecycleRules = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  await ctx.client.put<void>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(bucket)}/lifecycle`,
    lifecycleRules,
  );

  ctx.output.success(`Lifecycle rules updated for bucket "${bucket}".`);
}
