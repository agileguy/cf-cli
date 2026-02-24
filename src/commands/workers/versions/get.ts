import type { Context, WorkerVersion } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  const id = getStringFlag(flags, "id");

  if (!name) throw new UsageError("--name <script-name> is required.");
  if (!id) throw new UsageError("--id <version-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const version = await ctx.client.get<WorkerVersion>(
    `/accounts/${accountId}/workers/scripts/${name}/versions/${id}`,
  );

  ctx.output.detail({
    "Version ID": version.id,
    "Number": version.number,
    "Created": version.created_on,
    "Metadata": JSON.stringify(version.metadata),
    "Annotations": version.annotations
      ? Object.entries(version.annotations).map(([k, v]) => `${k}=${v}`).join(", ")
      : "-",
  });
}
