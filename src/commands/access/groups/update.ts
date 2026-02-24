import type { Context, AccessGroup } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <group-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <group-json> is required.");

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

  const group = await ctx.client.put<AccessGroup>(
    `${basePath}/groups/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Access group ${id} updated.`);
  ctx.output.detail({
    "ID": group.id,
    "Name": group.name,
  });
}
