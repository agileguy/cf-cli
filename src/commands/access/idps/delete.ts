import type { Context } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <idp-id> is required.");

  const confirmed = await confirm(
    `Delete identity provider ${id}?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `${basePath}/identity_providers/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Identity provider ${id} deleted.`);
}
