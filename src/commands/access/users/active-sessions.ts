import type { Context, AccessUserSession } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const userId = getStringFlag(flags, "userId");
  if (!userId) throw new UsageError("--user-id <user-id> is required.");

  const sessions = await ctx.client.get<AccessUserSession[]>(
    `${basePath}/users/${encodeURIComponent(userId)}/active_sessions`,
  );

  ctx.output.json(sessions);
}
