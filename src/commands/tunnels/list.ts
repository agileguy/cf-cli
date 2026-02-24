import type { Context, CfdTunnel, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const params: Record<string, string> = {};
  const name = getStringFlag(flags, "name");
  if (name) params["name"] = name;
  if (getBoolFlag(flags, "isDeleted")) params["is_deleted"] = "true";

  const tunnels = await ctx.client.get<CfdTunnel[]>(
    `/accounts/${encodeURIComponent(accountId)}/cfd_tunnel`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "status", header: "Status", width: 12 },
    { key: "created_at", header: "Created" },
  ];

  ctx.output.table(tunnels as unknown as Record<string, unknown>[], columns);
}
