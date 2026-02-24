import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";
import { validateId } from "../../utils/validators.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");

  if (!id) {
    throw new UsageError("--id <zone-id> is required.");
  }

  const validatedId = validateId(id, "zone ID");

  const confirmed = await confirm(
    `Delete zone ${validatedId}? This cannot be undone.`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<{ id: string }>(`/zones/${validatedId}`);

  ctx.output.success(`Zone ${validatedId} deleted.`);
}
