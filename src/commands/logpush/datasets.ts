import type { Context, LogpushDataset } from "../../types/index.js";
import { resolveLogpushScope } from "./scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveLogpushScope(args, ctx);

  const datasets = await ctx.client.get<LogpushDataset[]>(`${basePath}/datasets`);
  const list = Array.isArray(datasets) ? datasets : [];

  ctx.output.table(list, [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "description", header: "Description" },
  ]);
}
