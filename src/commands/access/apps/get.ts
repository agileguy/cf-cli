import type { Context, AccessApplication } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <app-id> is required.");

  const app = await ctx.client.get<AccessApplication>(
    `${basePath}/apps/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": app.id,
    "Name": app.name,
    "Domain": app.domain,
    "Type": app.type ?? "",
    "Session Duration": app.session_duration ?? "",
    "AUD": app.aud ?? "",
    "Created": app.created_at ?? "",
    "Updated": app.updated_at ?? "",
  });
}
