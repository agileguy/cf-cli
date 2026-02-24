import type { Context, WorkerScript } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <script-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const script = await ctx.client.get<WorkerScript>(
    `/accounts/${accountId}/workers/scripts/${encodeURIComponent(name)}`,
  );

  ctx.output.detail({
    "Name": script.id,
    "ETag": script.etag,
    "Handlers": script.handlers.join(", "),
    "Compatibility Date": script.compatibility_date ?? "-",
    "Compatibility Flags": script.compatibility_flags?.join(", ") ?? "-",
    "Usage Model": script.usage_model ?? "-",
    "Logpush": script.logpush ?? false,
    "Last Deployed From": script.last_deployed_from ?? "-",
    "Created": script.created_on,
    "Modified": script.modified_on,
  });
}
