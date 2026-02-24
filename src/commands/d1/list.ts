import type { Context, D1Database, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const databases = await ctx.client.get<D1Database[]>(
    `/accounts/${encodeURIComponent(accountId)}/d1/database`,
  );

  const columns: ColumnDef[] = [
    { key: "uuid", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "version", header: "Version", width: 10 },
    { key: "num_tables", header: "Tables", width: 8 },
    { key: "file_size", header: "Size", width: 12, transform: (v) => typeof v === "number" ? formatBytes(v) : String(v ?? "") },
    { key: "created_at", header: "Created", width: 25 },
  ];

  ctx.output.table(databases as unknown as Record<string, unknown>[], columns);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${units[i]}`;
}
