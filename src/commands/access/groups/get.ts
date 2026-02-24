import type { Context, AccessGroup } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <group-id> is required.");

  const group = await ctx.client.get<AccessGroup>(
    `${basePath}/groups/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": group.id,
    "Name": group.name,
    "Include Rules": group.include?.length ?? 0,
    "Exclude Rules": group.exclude?.length ?? 0,
    "Require Rules": group.require?.length ?? 0,
    "Created": group.created_at ?? "",
    "Updated": group.updated_at ?? "",
  });
}
