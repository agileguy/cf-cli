import type { Context, GatewayPolicy } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveGatewayScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveGatewayScope(args, ctx);

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

  const policy = await ctx.client.post<GatewayPolicy>(
    `${basePath}/rules`,
    body,
  );

  ctx.output.success(`Gateway HTTP policy created: ${policy.id}`);
  ctx.output.detail({
    "ID": policy.id,
    "Name": policy.name,
    "Action": policy.action,
    "Precedence": policy.precedence ?? "",
  });
}
