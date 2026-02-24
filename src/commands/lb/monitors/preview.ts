import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <monitor-id> is required.");

  const result = await ctx.client.get<unknown>(
    `/user/load_balancers/monitors/${encodeURIComponent(id)}/preview`,
  );

  ctx.output.json(result);
}
