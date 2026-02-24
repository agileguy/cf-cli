import type { Context, AccessServiceToken } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <token-id> is required.");

  const name = getStringFlag(flags, "name");

  const body: Record<string, unknown> = {};
  if (name) body.name = name;

  const token = await ctx.client.put<AccessServiceToken>(
    `${basePath}/service_tokens/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Service token ${id} updated.`);
  ctx.output.detail({
    "ID": token.id,
    "Name": token.name,
    "Client ID": token.client_id,
  });
}
