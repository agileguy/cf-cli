import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <namespace-id> is required.");

  const title = getStringFlag(flags, "title");
  if (!title) throw new UsageError("--title <new-title> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  await ctx.client.put<void>(
    `/accounts/${accountId}/storage/kv/namespaces/${id}`,
    { title },
  );

  ctx.output.success(`KV namespace ${id} renamed to "${title}".`);
}
