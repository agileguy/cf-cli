import type { Context, CallsApp, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const apps = await ctx.client.get<CallsApp[]>(
    `/accounts/${encodeURIComponent(accountId)}/calls/apps`,
  );

  const columns: ColumnDef[] = [
    { key: "uid", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "created", header: "Created", width: 24 },
  ];

  ctx.output.table(apps as unknown as Record<string, unknown>[], columns);
}
