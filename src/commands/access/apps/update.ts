import type { Context, AccessApplication } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <app-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <app-json> is required.");

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

  const app = await ctx.client.put<AccessApplication>(
    `${basePath}/apps/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Access application ${id} updated.`);
  ctx.output.detail({
    "ID": app.id,
    "Name": app.name,
    "Domain": app.domain,
    "Type": app.type ?? "",
  });
}
