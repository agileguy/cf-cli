import type { Context, D1Database } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const database = getStringFlag(flags, "database");
  if (!database) throw new UsageError("--database <name-or-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const db = await ctx.client.get<D1Database>(
    `/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(database)}`,
  );

  ctx.output.detail({
    "ID": db.uuid,
    "Name": db.name,
    "Version": db.version,
    "Tables": db.num_tables ?? 0,
    "File Size": db.file_size ?? 0,
    "Region": db.running_in_region ?? "(auto)",
    "Created": db.created_at,
  });
}
