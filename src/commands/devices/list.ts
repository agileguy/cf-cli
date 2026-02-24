import type { Context, ZTDevice, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const devices = await ctx.client.get<ZTDevice[]>(
    `/accounts/${encodeURIComponent(accountId)}/devices`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 24 },
    { key: "device_type", header: "Type", width: 12 },
    { key: "user.email", header: "User", width: 24 },
    { key: "last_seen", header: "Last Seen" },
  ];

  ctx.output.table(devices as unknown as Record<string, unknown>[], columns);
}
