import type { Context, CfdTunnelConnection, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <tunnel-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const connections = await ctx.client.get<CfdTunnelConnection[]>(
    `/accounts/${encodeURIComponent(accountId)}/cfd_tunnel/${encodeURIComponent(id)}/connections`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "colo_name", header: "Colo", width: 10 },
    { key: "client_version", header: "Version", width: 12 },
    { key: "origin_ip", header: "Origin IP", width: 18 },
    { key: "opened_at", header: "Opened" },
  ];

  ctx.output.table(connections as unknown as Record<string, unknown>[], columns);
}
