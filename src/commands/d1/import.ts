import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const database = getStringFlag(flags, "database");
  if (!database) throw new UsageError("--database <id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <sql-file> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  // D1 import uses the query endpoint to execute SQL statements
  await ctx.client.post<void>(
    `/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(database)}/query`,
    { sql: content },
  );

  ctx.output.success(`SQL imported into database "${database}" from "${file}".`);
}
