import type { Context } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveGatewayScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveGatewayScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <policy-id> is required.");

  const confirmed = await confirm(
    `Delete gateway DNS policy ${id}?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `${basePath}/rules/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Gateway DNS policy ${id} deleted.`);
}
