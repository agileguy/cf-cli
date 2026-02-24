import type { Context, RadarAnnotation, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const params: Record<string, string> = {};
  const from = getStringFlag(flags, "from");
  const to = getStringFlag(flags, "to");

  if (from) params["dateStart"] = from;
  if (to) params["dateEnd"] = to;

  const result = await ctx.client.get<RadarAnnotation[]>(
    "/radar/annotations",
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 12 },
    { key: "description", header: "Description", width: 40 },
    { key: "event_type", header: "Type", width: 16 },
    { key: "data_source", header: "Source", width: 16 },
    { key: "start_date", header: "Start", width: 12, transform: (v: unknown) => v ? String(v).slice(0, 10) : "-" },
    { key: "end_date", header: "End", width: 12, transform: (v: unknown) => v ? String(v).slice(0, 10) : "-" },
  ];

  ctx.output.table(result, columns);
}
