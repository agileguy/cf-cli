import type { Context, WorkerCronSchedule, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  const crons = getListFlag(flags, "crons");

  if (!name) throw new UsageError("--name <script-name> is required.");
  if (!crons || crons.length === 0) {
    throw new UsageError("--crons <expr1,expr2,...> is required.");
  }

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body = crons.map((cron) => ({ cron }));

  const result = await ctx.client.put<WorkerCronSchedule>(
    `/accounts/${accountId}/workers/scripts/${encodeURIComponent(name)}/schedules`,
    body,
  );

  const schedules = result.schedules ?? [];

  ctx.output.success(`Cron triggers updated for "${name}".`);

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
