import type { Context, CFImage } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <image-id> is required.");

  const name = getStringFlag(flags, "name");
  const metadata = getStringFlag(flags, "metadata");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const body: Record<string, unknown> = {};
  if (metadata) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(metadata);
    } catch {
      throw new UsageError("--metadata must be valid JSON.");
    }
    body["metadata"] = parsed;
  } else if (name) {
    body["metadata"] = { name };
  }

  const image = await ctx.client.patch<CFImage>(
    `/accounts/${encodeURIComponent(accountId)}/images/v1/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Image updated: ${image.id}`);
}
