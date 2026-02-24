import type { Context, LogpushJob } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveLogpushScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveLogpushScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <job-id> is required.");

  await ctx.client.put<LogpushJob>(
    `${basePath}/jobs/${encodeURIComponent(id)}`,
    { enabled: true },
  );

  ctx.output.success(`Logpush job ${id} enabled.`);
}
