import type { Context, LoadBalancerMonitor } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <monitor-json> is required.");

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

  const monitor = await ctx.client.post<LoadBalancerMonitor>(
    "/user/load_balancers/monitors",
    body,
  );

  ctx.output.success(`Monitor created: ${monitor.id}`);
  ctx.output.detail({
    "ID": monitor.id,
    "Type": monitor.type,
    "Description": monitor.description ?? "",
  });
}
