import type { Context, WorkerCronSchedule, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <script-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<WorkerCronSchedule>(
    `/accounts/${accountId}/workers/scripts/${encodeURIComponent(name)}/schedules`,
  );

  const schedules = result.schedules ?? [];

  const columns: ColumnDef[] = [
    { key: "cron", header: "Cron Expression", width: 30 },
    {
      key: "created_on",
      header: "Created",
      width: 12,
      transform: (v: unknown) => String(v).slice(0, 10),
    },
    {
      key: "modified_on",
      header: "Modified",
      width: 12,
      transform: (v: unknown) => String(v).slice(0, 10),
    },
  ];

  ctx.output.table(schedules as unknown as Record<string, unknown>[], columns);
}
