import type { Context, LogpushJob } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveLogpushScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveLogpushScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <job-id> is required.");

  const job = await ctx.client.get<LogpushJob>(
    `${basePath}/jobs/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": job.id,
    "Name": job.name ?? "",
    "Dataset": job.dataset,
    "Enabled": job.enabled,
    "Destination": job.destination_conf,
    "Frequency": job.frequency ?? "",
    "Last Complete": job.last_complete ?? "",
    "Last Error": job.last_error ?? "",
  });
}
