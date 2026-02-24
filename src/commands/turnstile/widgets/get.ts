import type { Context, TurnstileWidget } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const sitekey = getStringFlag(flags, "sitekey");
  if (!sitekey) throw new UsageError("--sitekey <key> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const widget = await ctx.client.get<TurnstileWidget>(
    `/accounts/${encodeURIComponent(accountId)}/challenges/widgets/${encodeURIComponent(sitekey)}`,
  );

  ctx.output.detail({
    "Sitekey": widget.sitekey,
    "Name": widget.name,
    "Mode": widget.mode,
    "Domains": widget.domains.join(", "),
    "Bot Fight Mode": widget.bot_fight_mode,
    "Region": widget.region ?? "(default)",
    "Created": widget.created_on,
    "Modified": widget.modified_on,
  });
}
