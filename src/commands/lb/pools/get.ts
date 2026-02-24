import type { Context, LoadBalancerPool } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <pool-id> is required.");

  const pool = await ctx.client.get<LoadBalancerPool>(
    `/user/load_balancers/pools/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": pool.id,
    "Name": pool.name,
    "Enabled": pool.enabled,
    "Healthy": pool.healthy ?? "unknown",
    "Monitor": pool.monitor ?? "",
    "Origins": pool.origins.map((o) => `${o.name}=${o.address}`).join(", "),
    "Check Regions": pool.check_regions?.join(", ") ?? "",
    "Created": pool.created_on ?? "",
    "Modified": pool.modified_on ?? "",
  });
}
