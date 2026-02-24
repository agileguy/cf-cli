import type { Context, LogpushJob } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveLogpushScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveLogpushScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <job-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <job-json> is required.");

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

  const job = await ctx.client.put<LogpushJob>(
    `${basePath}/jobs/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Logpush job ${id} updated.`);
  ctx.output.detail({
    "ID": job.id,
    "Name": job.name ?? "",
    "Dataset": job.dataset,
    "Enabled": job.enabled,
    "Destination": job.destination_conf,
  });
}
