import type { Context, MagicRoute } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <route-json> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

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
    throw new UsageError(`File "${file}" does not contain valid JSON.`);
  }

  const result = await ctx.client.post<{ routes: MagicRoute[] }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/routes`,
    body,
  );

  const routes = result.routes ?? [];
  if (routes.length > 0) {
    const route = routes[0]!;
    ctx.output.success(`Route created: ${route.prefix}`);
    ctx.output.detail({
      "ID": route.id,
      "Prefix": route.prefix,
      "Priority": route.priority,
    });
  } else {
    ctx.output.success("Route created.");
  }
}
