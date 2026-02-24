import type { Context, UserToken } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <token-id> is required.");

  const token = await ctx.client.put<UserToken>(
    `/user/tokens/${encodeURIComponent(id)}/value`,
    {},
  );

  ctx.output.success(`Token ${id} rolled successfully.`);
  if (token.value) {
    ctx.output.info(`New token value: ${token.value}`);
    ctx.output.warn("Save this value now - it will not be shown again.");
  }
}
