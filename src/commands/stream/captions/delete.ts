import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const video = getStringFlag(flags, "video");
  if (!video) throw new UsageError("--video <video-id> is required.");

  const language = getStringFlag(flags, "language");
  if (!language) throw new UsageError("--language <lang> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  if (!await confirm(`Delete captions for language "${language}" on video ${video}?`, ctx.flags)) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete(
    `/accounts/${encodeURIComponent(accountId)}/stream/${encodeURIComponent(video)}/captions/${encodeURIComponent(language)}`,
  );

  ctx.output.success(`Deleted captions: ${language} on video ${video}`);
}
