import type { Context, CFImage } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <image-id> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const image = await ctx.client.get<CFImage>(
    `/accounts/${encodeURIComponent(accountId)}/images/v1/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": image.id,
    "Filename": image.filename ?? "-",
    "Uploaded": image.uploaded ?? "-",
    "Signed URLs": image.requireSignedURLs ?? false,
    "Variants": (image.variants ?? []).join(", ") || "-",
    "Meta": image.meta ? JSON.stringify(image.meta) : "-",
  });
}
