import type { Context, WorkerNamespace } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <namespace-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const ns = await ctx.client.get<WorkerNamespace>(
    `/accounts/${accountId}/workers/dispatch/namespaces/${id}`,
  );

  ctx.output.detail({
    "Namespace ID": ns.namespace_id,
    "Name": ns.namespace_name,
    "Script Count": ns.script_count ?? 0,
    "Class": ns.class ?? "-",
    "Created": ns.created_on,
    "Modified": ns.modified_on,
  });
}
