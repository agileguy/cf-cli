import type { Context, AccessServiceToken } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <token-id> is required.");

  const token = await ctx.client.post<AccessServiceToken>(
    `${basePath}/service_tokens/${encodeURIComponent(id)}/rotate`,
    {},
  );

  ctx.output.success(`Service token ${id} rotated.`);
  ctx.output.detail({
    "ID": token.id,
    "Name": token.name,
    "Client ID": token.client_id,
    "Client Secret": token.client_secret ?? "(hidden)",
    "Expires": token.expires_at ?? "never",
  });
}
