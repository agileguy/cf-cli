import type { Context, AIModel, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const params: Record<string, string> = {};
  const task = getStringFlag(flags, "task");
  if (task) params["task"] = task;
  const search = getStringFlag(flags, "search");
  if (search) params["search"] = search;

  const models = await ctx.client.get<AIModel[]>(
    `/accounts/${encodeURIComponent(accountId)}/ai/models/search`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "name", header: "Model", width: 50 },
    {
      key: "task",
      header: "Task",
      width: 25,
      transform: (v: unknown) => {
        if (v && typeof v === "object" && "name" in (v as Record<string, unknown>)) {
          return (v as Record<string, unknown>).name as string;
        }
        return "-";
      },
    },
    { key: "description", header: "Description", width: 40 },
  ];

  ctx.output.table(models as unknown as Record<string, unknown>[], columns);
}
