import type { Context, DevicePostureRule, ColumnDef } from "../../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../../utils/args.js";
import { resolveAccountId } from "../../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const rules = await ctx.client.get<DevicePostureRule[]>(
    `/accounts/${encodeURIComponent(accountId)}/devices/posture`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "type", header: "Type", width: 16 },
    { key: "description", header: "Description" },
  ];

  ctx.output.table(rules as unknown as Record<string, unknown>[], columns);
}
