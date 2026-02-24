import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <token-id> is required.");

  const confirmed = await confirm(`Delete API token "${id}"?`, ctx.flags);

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<{ id: string }>(
    `/user/tokens/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Token ${id} deleted.`);
}
