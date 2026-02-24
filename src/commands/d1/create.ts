import type { Context, D1Database } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <database-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = { name };
  const location = getStringFlag(flags, "location");
  if (location) body["primary_location_hint"] = location;

  const db = await ctx.client.post<D1Database>(
    `/accounts/${encodeURIComponent(accountId)}/d1/database`,
    body,
  );

  ctx.output.success(`D1 database "${db.name}" created (ID: ${db.uuid}).`);
}
