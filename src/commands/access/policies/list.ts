import type { Context, AccessPolicy, ColumnDef } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const app = getStringFlag(flags, "app");
  if (!app) throw new UsageError("--app <app-id> is required.");

  const policies = await ctx.client.get<AccessPolicy[]>(
    `${basePath}/apps/${encodeURIComponent(app)}/policies`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "name", header: "Name", width: 30 },
    { key: "decision", header: "Decision", width: 12 },
    { key: "precedence", header: "Precedence", width: 10 },
    {
      key: "created_at",
      header: "Created",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(policies, columns);
}
