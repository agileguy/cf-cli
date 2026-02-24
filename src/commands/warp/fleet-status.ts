import type { Context, FleetStatusDevice, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const devices = await ctx.client.get<FleetStatusDevice[]>(
    `/accounts/${encodeURIComponent(accountId)}/devices/fleet_status`,
  );

  const columns: ColumnDef[] = [
    { key: "device_id", header: "Device ID", width: 36 },
    { key: "device_name", header: "Name", width: 20 },
    { key: "status", header: "Status", width: 12 },
    { key: "platform", header: "Platform", width: 12 },
    { key: "version", header: "Version", width: 12 },
    { key: "colo", header: "Colo", width: 8 },
    { key: "last_seen", header: "Last Seen" },
  ];

  ctx.output.table(devices as unknown as Record<string, unknown>[], columns);
}
