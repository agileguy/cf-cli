import type { Context, LoadBalancerMonitor } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <monitor-id> is required.");

  const monitor = await ctx.client.get<LoadBalancerMonitor>(
    `/user/load_balancers/monitors/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": monitor.id,
    "Type": monitor.type,
    "Description": monitor.description ?? "",
    "Method": monitor.method ?? "",
    "Path": monitor.path ?? "",
    "Port": monitor.port ?? "",
    "Interval": monitor.interval ?? "",
    "Timeout": monitor.timeout ?? "",
    "Retries": monitor.retries ?? "",
    "Expected Codes": monitor.expected_codes ?? "",
    "Created": monitor.created_on ?? "",
    "Modified": monitor.modified_on ?? "",
  });
}
