import type { Context, StreamWatermark, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const watermarks = await ctx.client.get<StreamWatermark[]>(
    `/accounts/${encodeURIComponent(accountId)}/stream/watermarks`,
  );

  const columns: ColumnDef[] = [
    { key: "uid", header: "ID", width: 34 },
    { key: "name", header: "Name", width: 20 },
    { key: "size", header: "Size", width: 10, transform: (v: unknown) => v != null ? String(v) : "-" },
    { key: "position", header: "Position", width: 12 },
    { key: "created", header: "Created", width: 12, transform: (v: unknown) => v ? String(v).slice(0, 10) : "-" },
  ];

  ctx.output.table(watermarks, columns);
}
