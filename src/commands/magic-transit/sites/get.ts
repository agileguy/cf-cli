import type { Context, MagicSite } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <site-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<{ site: MagicSite }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/sites/${encodeURIComponent(id)}`,
  );

  const site = result.site;

  ctx.output.detail({
    "ID": site.id,
    "Name": site.name,
    "Description": site.description ?? "",
    "Connector ID": site.connector_id ?? "",
    "HA Mode": site.ha_mode ?? false,
    "Created": site.created_on ?? "",
    "Modified": site.modified_on ?? "",
  });
}
