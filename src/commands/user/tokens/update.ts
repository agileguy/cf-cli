import type { Context, UserToken } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <token-id> is required.");

  const name = getStringFlag(flags, "name");
  const status = getStringFlag(flags, "status");

  if (!name && !status) {
    throw new UsageError("At least one of --name or --status is required.");
  }

  const body: Record<string, unknown> = {};
  if (name) body.name = name;
  if (status) {
    if (status !== "active" && status !== "disabled") {
      throw new UsageError('--status must be "active" or "disabled".');
    }
    body.status = status;
  }

  const token = await ctx.client.put<UserToken>(
    `/user/tokens/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Token "${token.name}" updated (ID: ${token.id}).`);
}
