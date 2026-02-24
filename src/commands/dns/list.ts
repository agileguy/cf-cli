import type { Context, DnsRecord, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag, getBoolFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const type = getStringFlag(flags, "type");
  const name = getStringFlag(flags, "name");
  const content = getStringFlag(flags, "content");
  const page = getNumberFlag(flags, "page");
  const perPage = getNumberFlag(flags, "perPage");
  const all = getBoolFlag(flags, "all");

  if (!zone) {
    throw new UsageError("--zone <zone-id-or-name> is required.");
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const params: Record<string, string> = {};
  if (type) params["type"] = type.toUpperCase();
  if (name) params["name"] = name;
  if (content) params["content"] = content;
  if (page) params["page"] = String(page);
  if (perPage) params["per_page"] = String(perPage);

  let records: DnsRecord[];

  if (all) {
    records = await ctx.client.fetchAll<DnsRecord>(
      `/zones/${zoneId}/dns_records`,
      params,
    );
  } else {
    records = await ctx.client.get<DnsRecord[]>(
      `/zones/${zoneId}/dns_records`,
      params,
    );
  }

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "type", header: "Type", width: 8 },
    { key: "name", header: "Name", width: 30 },
    { key: "content", header: "Content", width: 30 },
    {
      key: "ttl",
      header: "TTL",
      width: 8,
      transform: (v: unknown) => (v as number) === 1 ? "Auto" : String(v),
    },
    {
      key: "proxied",
      header: "Proxied",
      width: 8,
      transform: (v: unknown) => (v as boolean) ? "Yes" : "No",
    },
    {
      key: "modified_on",
      header: "Modified",
      width: 12,
      transform: (v: unknown) => String(v).slice(0, 10),
    },
  ];

  ctx.output.table(records, columns);
}
