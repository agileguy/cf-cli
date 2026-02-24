import type { Context, AccessPolicy } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const app = getStringFlag(flags, "app");
  if (!app) throw new UsageError("--app <app-id> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <policy-id> is required.");

  const policy = await ctx.client.get<AccessPolicy>(
    `${basePath}/apps/${encodeURIComponent(app)}/policies/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": policy.id,
    "Name": policy.name,
    "Decision": policy.decision,
    "Precedence": policy.precedence,
    "Include Rules": policy.include?.length ?? 0,
    "Exclude Rules": policy.exclude?.length ?? 0,
    "Require Rules": policy.require?.length ?? 0,
    "Created": policy.created_at ?? "",
    "Updated": policy.updated_at ?? "",
  });
}
