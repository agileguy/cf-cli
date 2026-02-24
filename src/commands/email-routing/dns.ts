import type { Context, EmailRoutingDNS, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const records = await ctx.client.get<EmailRoutingDNS[]>(
    `/zones/${encodeURIComponent(zoneId)}/email/routing/dns`,
  );

  const columns: ColumnDef[] = [
    { key: "type", header: "Type", width: 10 },
    { key: "name", header: "Name", width: 40 },
    { key: "content", header: "Content", width: 50 },
    { key: "ttl", header: "TTL", width: 8 },
    { key: "priority", header: "Priority", width: 10 },
  ];

  ctx.output.table(records, columns);
}
