import type { Context, HyperdriveConfig } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <config-name> is required.");

  const connectionString = getStringFlag(flags, "connectionString");
  if (!connectionString) throw new UsageError("--connection-string <conn> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // Parse connection string: postgres://user:password@host:port/database
  const origin = parseConnectionString(connectionString);

  const result = await ctx.client.post<HyperdriveConfig>(
    `/accounts/${encodeURIComponent(accountId)}/hyperdrive/configs`,
    { name, origin },
  );

  ctx.output.success(`Hyperdrive "${result.name}" created (ID: ${result.id}).`);
}

/** Parse a PostgreSQL connection string into origin fields */
function parseConnectionString(conn: string): Record<string, unknown> {
  try {
    const url = new URL(conn);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 5432,
      database: url.pathname.replace(/^\//, ""),
      scheme: url.protocol.replace(/:$/, ""),
      user: url.username || undefined,
      password: url.password || undefined,
    };
  } catch {
    throw new UsageError(
      `Invalid connection string. Expected format: postgres://user:password@host:port/database`,
    );
  }
}
