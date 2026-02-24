import type { Context } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const app = getStringFlag(flags, "app");
  if (!app) throw new UsageError("--app <app-id> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <policy-id> is required.");

  const confirmed = await confirm(
    `Delete access policy ${id}?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `${basePath}/apps/${encodeURIComponent(app)}/policies/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Access policy ${id} deleted.`);
}
