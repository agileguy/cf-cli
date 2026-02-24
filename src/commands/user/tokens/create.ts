import type { Context, UserToken } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <token-name> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <token-policy-json> is required.");

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const payload = { name, ...(body as Record<string, unknown>) };

  const token = await ctx.client.post<UserToken>("/user/tokens", payload);

  ctx.output.success(`Token "${token.name}" created (ID: ${token.id}).`);
  if (token.value) {
    ctx.output.info(`Token value: ${token.value}`);
    ctx.output.warn("Save this value now - it will not be shown again.");
  }
}
