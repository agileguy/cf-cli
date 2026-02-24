import type { Context, RadarLocation, ColumnDef } from "../../types/index.js";

export async function run(_args: string[], ctx: Context): Promise<void> {

  const result = await ctx.client.get<RadarLocation[]>(
    "/radar/entities/locations",
  );

  const columns: ColumnDef[] = [
    { key: "code", header: "Code", width: 6 },
    { key: "name", header: "Name", width: 30 },
    { key: "region", header: "Region", width: 20 },
    { key: "subregion", header: "Subregion", width: 24 },
  ];

  ctx.output.table(result, columns);
}
