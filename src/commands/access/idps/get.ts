import type { Context, AccessIdentityProvider } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <idp-id> is required.");

  const idp = await ctx.client.get<AccessIdentityProvider>(
    `${basePath}/identity_providers/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": idp.id,
    "Name": idp.name,
    "Type": idp.type,
    "Created": idp.created_at ?? "",
    "Updated": idp.updated_at ?? "",
  });

  if (idp.config) {
    ctx.output.json(idp.config);
  }
}
