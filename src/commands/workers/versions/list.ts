import type { Context, WorkerVersion, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <script-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const versions = await ctx.client.get<WorkerVersion[]>(
    `/accounts/${accountId}/workers/scripts/${encodeURIComponent(name)}/versions`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "Version ID", width: 38 },
    { key: "number", header: "#", width: 6 },
    {
      key: "created_on",
      header: "Created",
      width: 20,
      transform: (v: unknown) => String(v).slice(0, 19).replace("T", " "),
    },
  ];

  ctx.output.table(versions as unknown as Record<string, unknown>[], columns);
}
