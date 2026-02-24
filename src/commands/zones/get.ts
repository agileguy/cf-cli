import type { Context, Zone } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  const name = getStringFlag(flags, "name");

  if (!id && !name) {
    throw new UsageError("Provide --id <zone-id> or --name <domain-name>.");
  }

  let zoneId: string;
  if (id) {
    zoneId = id;
  } else {
    zoneId = await resolveZoneId(name!, ctx.client);
  }

  const zone = await ctx.client.get<Zone>(`/zones/${zoneId}`);

  ctx.output.detail({
    "ID": zone.id,
    "Name": zone.name,
    "Status": zone.status,
    "Paused": zone.paused,
    "Type": zone.type,
    "Development Mode": zone.development_mode,
    "Name Servers": zone.name_servers.join(", "),
    "Original NS": zone.original_name_servers.join(", "),
    "Original Registrar": zone.original_registrar ?? "-",
    "Account ID": zone.account.id,
    "Account Name": zone.account.name,
    "Plan": zone.plan.name,
    "Created": zone.created_on,
    "Modified": zone.modified_on,
    "Activated": zone.activated_on,
  });
}
