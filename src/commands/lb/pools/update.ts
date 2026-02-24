import type { Context, LoadBalancerPool } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <pool-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <pool-json> is required.");

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const pool = await ctx.client.put<LoadBalancerPool>(
    `/user/load_balancers/pools/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Pool "${id}" updated.`);
  ctx.output.detail({
    "ID": pool.id,
    "Name": pool.name,
    "Enabled": pool.enabled,
  });
}
