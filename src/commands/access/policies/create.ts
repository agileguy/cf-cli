import type { Context, AccessPolicy } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const app = getStringFlag(flags, "app");
  if (!app) throw new UsageError("--app <app-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <policy-json> is required.");

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

  const policy = await ctx.client.post<AccessPolicy>(
    `${basePath}/apps/${encodeURIComponent(app)}/policies`,
    body,
  );

  ctx.output.success(`Access policy created: ${policy.id}`);
  ctx.output.detail({
    "ID": policy.id,
    "Name": policy.name,
    "Decision": policy.decision,
    "Precedence": policy.precedence,
  });
}
