import type { Context, LoadBalancerRegion, ColumnDef } from "../../types/index.js";
import { parseArgs as _parseArgs } from "../../utils/args.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  _parseArgs(args); // consume args for consistency

  const regions = await ctx.client.get<Record<string, LoadBalancerRegion>>(
    "/user/load_balancers/analytics/regions",
  );

  // The API returns an object keyed by region code
  const rows: Record<string, unknown>[] = [];
  if (regions && typeof regions === "object") {
    for (const [code, region] of Object.entries(regions)) {
      rows.push({
        region_code: code,
        countries: Array.isArray(region.countries) ? region.countries.join(", ") : "",
      });
    }
  }

  const columns: ColumnDef[] = [
    { key: "region_code", header: "Region", width: 12 },
    { key: "countries", header: "Countries" },
  ];

  ctx.output.table(rows, columns);
}
