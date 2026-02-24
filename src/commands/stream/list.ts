import type { Context, StreamVideo, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);
  const start = getStringFlag(flags, "start");
  const end = getStringFlag(flags, "end");

  const params: Record<string, string> = {};
  if (start) params["start"] = start;
  if (end) params["end"] = end;

  const videos = await ctx.client.get<StreamVideo[]>(
    `/accounts/${encodeURIComponent(accountId)}/stream`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "uid", header: "ID", width: 34 },
    { key: "status", header: "Status", width: 12, transform: (v: unknown) => {
      const s = v as StreamVideo["status"];
      return s?.state ?? "unknown";
    }},
    { key: "duration", header: "Duration", width: 10, transform: (v: unknown) => v != null ? `${v}s` : "-" },
    { key: "size", header: "Size", width: 12, transform: (v: unknown) => v != null ? String(v) : "-" },
    { key: "created", header: "Created", width: 12, transform: (v: unknown) => v ? String(v).slice(0, 10) : "-" },
  ];

  ctx.output.table(videos, columns);
}
