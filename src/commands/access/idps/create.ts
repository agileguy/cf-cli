import type { Context, AccessIdentityProvider } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <idp-json> is required.");

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

  const idp = await ctx.client.post<AccessIdentityProvider>(
    `${basePath}/identity_providers`,
    body,
  );

  ctx.output.success(`Identity provider created: ${idp.id}`);
  ctx.output.detail({
    "ID": idp.id,
    "Name": idp.name,
    "Type": idp.type,
  });
}
