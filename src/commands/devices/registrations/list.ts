import type { Context, DeviceRegistration, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const registrations = await ctx.client.get<DeviceRegistration[]>(
    `/accounts/${encodeURIComponent(accountId)}/devices/registrations`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "device_id", header: "Device ID", width: 36 },
    { key: "user.email", header: "User", width: 24 },
    { key: "status", header: "Status", width: 12 },
    { key: "created_at", header: "Created" },
  ];

  ctx.output.table(registrations as unknown as Record<string, unknown>[], columns);
}
