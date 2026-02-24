import type { Context, CallsApp } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const app = await ctx.client.post<CallsApp>(
    `/accounts/${encodeURIComponent(accountId)}/calls/apps`,
    { name },
  );

  ctx.output.success(`Calls app "${name}" created (ID: ${app.uid}).`);
}
