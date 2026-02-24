import type { Context, CallsApp } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <app-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const app = await ctx.client.get<CallsApp>(
    `/accounts/${encodeURIComponent(accountId)}/calls/apps/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": app.uid,
    "Name": app.name,
    "Created": app.created ?? "-",
    "Modified": app.modified ?? "-",
  });
}
