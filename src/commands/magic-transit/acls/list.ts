import type { Context, MagicACL, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<{ acls: MagicACL[] }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/cf_interconnects/acls`,
  );

  const acls = result.acls ?? [];

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 25 },
    { key: "description", header: "Description", width: 40 },
    { key: "forward_locally", header: "Forward Locally", width: 16 },
  ];

  ctx.output.table(acls as unknown as Record<string, unknown>[], columns);
}
