import type { Context, RadarDataset, ColumnDef } from "../../types/index.js";

export async function run(_args: string[], ctx: Context): Promise<void> {

  const result = await ctx.client.get<RadarDataset[]>(
    "/radar/datasets",
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 12 },
    { key: "title", header: "Title", width: 30 },
    { key: "description", header: "Description", width: 40 },
    { key: "type", header: "Type", width: 12 },
  ];

  ctx.output.table(result, columns);
}
