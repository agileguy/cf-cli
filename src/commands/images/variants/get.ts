import type { Context, CFImageVariant } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <variant-id> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const variant = await ctx.client.get<CFImageVariant>(
    `/accounts/${encodeURIComponent(accountId)}/images/v1/variants/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": variant.id,
    "Fit": variant.options?.fit ?? "-",
    "Width": variant.options?.width ?? "-",
    "Height": variant.options?.height ?? "-",
    "Metadata": variant.options?.metadata ?? "-",
    "Public": variant.neverRequireSignedURLs ?? false,
  });
}
