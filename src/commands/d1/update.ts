import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const database = getStringFlag(flags, "database");
  if (!database) throw new UsageError("--database <id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {};
  const name = getStringFlag(flags, "name");
  if (name) body["name"] = name;

  if (Object.keys(body).length === 0) {
    throw new UsageError("Provide at least one update flag (e.g. --name).");
  }

  await ctx.client.patch<void>(
    `/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(database)}`,
    body,
  );

  ctx.output.success(`D1 database "${database}" updated.`);
}
