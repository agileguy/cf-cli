import type { Context, StreamLiveInput, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const inputs = await ctx.client.get<StreamLiveInput[]>(
    `/accounts/${encodeURIComponent(accountId)}/stream/live_inputs`,
  );

  const columns: ColumnDef[] = [
    { key: "uid", header: "ID", width: 34 },
    { key: "meta", header: "Name", width: 20, transform: (v: unknown) => {
      const m = v as Record<string, unknown> | undefined;
      return m?.["name"] ? String(m["name"]) : "-";
    }},
    { key: "status", header: "Status", width: 12, transform: (v: unknown) => {
      const s = v as StreamLiveInput["status"];
      return s?.current?.state ?? "-";
    }},
    { key: "created", header: "Created", width: 12, transform: (v: unknown) => v ? String(v).slice(0, 10) : "-" },
  ];

  ctx.output.table(inputs, columns);
}
