import type { Context, D1QueryResult, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags, positional } = parseArgs(args);

  const database = getStringFlag(flags, "database");
  if (!database) throw new UsageError("--database <name-or-id> is required.");

  const sql = positional[0] ?? getStringFlag(flags, "sql");
  if (!sql) throw new UsageError("SQL query is required as a positional argument or --sql flag.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = { sql };
  const params = getStringFlag(flags, "params");
  if (params) {
    try {
      body["params"] = JSON.parse(params);
    } catch {
      throw new UsageError("--params must be a valid JSON array.");
    }
  }

  const results = await ctx.client.post<D1QueryResult[]>(
    `/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(database)}/query`,
    body,
  );

  const outputFormat = getStringFlag(flags, "output") ?? ctx.flags.output;

  // D1 returns an array of result sets (one per statement)
  for (const result of results) {
    if (!result.results || result.results.length === 0) {
      ctx.output.info(`Query OK. ${result.meta?.changes ?? 0} changes, ${result.meta?.duration ?? 0}ms.`);
      continue;
    }

    if (outputFormat === "json") {
      ctx.output.json(result.results);
      continue;
    }

    if (outputFormat === "csv") {
      const allKeys = Object.keys(result.results[0] ?? {});
      const csvColumns: ColumnDef[] = allKeys.map((k) => ({
        key: k,
        header: k,
      }));
      ctx.output.csv(result.results as unknown as Record<string, unknown>[], csvColumns);
      continue;
    }

    // Table output (default)
    const allKeys = Object.keys(result.results[0] ?? {});
    const columns: ColumnDef[] = allKeys.map((k) => ({
      key: k,
      header: k,
      width: 30,
    }));

    ctx.output.table(result.results as unknown as Record<string, unknown>[], columns);

    ctx.output.info(
      `${result.results.length} row(s), ${result.meta?.duration ?? 0}ms, ${result.meta?.rows_read ?? 0} read, ${result.meta?.rows_written ?? 0} written.`,
    );
  }
}
