import type { Context, HyperdriveConfig } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <hyperdrive-id> is required.");

  const name = getStringFlag(flags, "name");
  const connectionString = getStringFlag(flags, "connectionString");

  if (!name && !connectionString) {
    throw new UsageError("At least one of --name or --connection-string is required.");
  }

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {};

  if (name) {
    body["name"] = name;
  }

  if (connectionString) {
    body["origin"] = parseConnectionString(connectionString);
  }

  const result = await ctx.client.patch<HyperdriveConfig>(
    `/accounts/${encodeURIComponent(accountId)}/hyperdrive/configs/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Hyperdrive "${result.name}" updated.`);
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
