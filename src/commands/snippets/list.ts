import type { Context, Snippet, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const snippets = await ctx.client.get<Snippet[]>(
    `/zones/${encodeURIComponent(zoneId)}/snippets`,
  );

  const columns: ColumnDef[] = [
    { key: "snippet_name", header: "Name", width: 30 },
    { key: "main_module", header: "Main Module", width: 30 },
    { key: "created_on", header: "Created", width: 12, transform: (v: unknown) => String(v).slice(0, 10) },
    { key: "modified_on", header: "Modified", width: 12, transform: (v: unknown) => String(v).slice(0, 10) },
  ];

  ctx.output.table(snippets, columns);
}
