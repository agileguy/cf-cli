import type { Context, CallsTurnKey, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const keys = await ctx.client.get<CallsTurnKey[]>(
    `/accounts/${encodeURIComponent(accountId)}/calls/turn_keys`,
  );

  const columns: ColumnDef[] = [
    { key: "key_id", header: "Key ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "created", header: "Created", width: 24 },
  ];

  ctx.output.table(keys as unknown as Record<string, unknown>[], columns);
}
