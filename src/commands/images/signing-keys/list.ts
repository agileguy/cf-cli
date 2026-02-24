import type { Context, CFImageSigningKey, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const keys = await ctx.client.get<CFImageSigningKey[]>(
    `/accounts/${encodeURIComponent(accountId)}/images/v1/keys`,
  );

  const columns: ColumnDef[] = [
    { key: "name", header: "Name", width: 40 },
  ];

  ctx.output.table(keys, columns);
}
