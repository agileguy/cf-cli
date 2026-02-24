import type { Context, R2Metrics } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const bucket = getStringFlag(flags, "bucket");
  if (!bucket) throw new UsageError("--bucket <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const params: Record<string, string> = {};
  const from = getStringFlag(flags, "from");
  if (from) params["start"] = from;
  const to = getStringFlag(flags, "to");
  if (to) params["end"] = to;

  const metrics = await ctx.client.get<R2Metrics>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(bucket)}/metrics`,
    params,
  );

  ctx.output.detail({
    "Bucket": bucket,
    "Object Count": metrics.object_count,
    "Payload Size": formatBytes(metrics.payload_size),
    "Metadata Size": formatBytes(metrics.metadata_size),
    "Upload Count": metrics.upload_count,
    "Class A Ops": metrics.operations?.class_a ?? 0,
    "Class B Ops": metrics.operations?.class_b ?? 0,
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${units[i]}`;
}
