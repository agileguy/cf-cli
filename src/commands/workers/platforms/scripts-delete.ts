import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const namespace = getStringFlag(flags, "namespace");
  const name = getStringFlag(flags, "name");

  if (!namespace) throw new UsageError("--namespace <namespace-name> is required.");
  if (!name) throw new UsageError("--name <script-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const confirmed = await confirm(
    `Delete script "${name}" from namespace "${namespace}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${accountId}/workers/dispatch/namespaces/${namespace}/scripts/${name}`,
  );

  ctx.output.success(`Script "${name}" deleted from namespace "${namespace}".`);
}
