import type { Context, LogpushInstantLogs } from "../../types/index.js";
import { getStringFlag, getListFlag } from "../../utils/args.js";
import { resolveLogpushScope } from "./scope.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveLogpushScope(args, ctx);

  const dataset = getStringFlag(flags, "dataset");
  if (!dataset) throw new UsageError("--dataset <dataset> is required.");

  const body: Record<string, unknown> = { dataset };

  const fields = getListFlag(flags, "fields");
  if (fields) body.fields = fields.join(",");

  const from = getStringFlag(flags, "from");
  if (from) body.start_time = from;

  const to = getStringFlag(flags, "to");
  if (to) body.end_time = to;

  const result = await ctx.client.post<LogpushInstantLogs>(
    `${basePath}/edge`,
    body,
  );

  ctx.output.detail({
    "Session ID": result.session_id ?? "",
    "Destination": result.destination_conf ?? "",
    "Fields": result.fields ?? "",
  });
}
