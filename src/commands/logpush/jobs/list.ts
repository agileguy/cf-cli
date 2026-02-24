import type { Context, LogpushJob } from "../../../types/index.js";
import { resolveLogpushScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveLogpushScope(args, ctx);

  const jobs = await ctx.client.get<LogpushJob[]>(`${basePath}/jobs`);
  const list = Array.isArray(jobs) ? jobs : [];

  ctx.output.table(list, [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "dataset", header: "Dataset" },
    { key: "enabled", header: "Enabled" },
    { key: "destination_conf", header: "Destination" },
    { key: "last_complete", header: "Last Complete" },
  ]);
}
