import type { Context, KVNamespace } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const title = getStringFlag(flags, "title");
  if (!title) throw new UsageError("--title <namespace-title> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const ns = await ctx.client.post<KVNamespace>(
    `/accounts/${accountId}/storage/kv/namespaces`,
    { title },
  );

  ctx.output.success(`KV namespace "${ns.title}" created (ID: ${ns.id}).`);
}
