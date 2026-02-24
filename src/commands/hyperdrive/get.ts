import type { Context, HyperdriveConfig } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <hyperdrive-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const config = await ctx.client.get<HyperdriveConfig>(
    `/accounts/${encodeURIComponent(accountId)}/hyperdrive/configs/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": config.id,
    "Name": config.name,
    "Host": config.origin.host,
    "Port": config.origin.port,
    "Database": config.origin.database,
    "Scheme": config.origin.scheme,
    "User": config.origin.user ?? "(not set)",
    "Caching Disabled": config.caching?.disabled ?? false,
    "Created": config.created_on ?? "(unknown)",
    "Modified": config.modified_on ?? "(unknown)",
  });
}
