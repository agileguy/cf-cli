import type { Context, Ruleset } from "../../types/index.js";
import { getStringFlag } from "../../utils/args.js";
import { resolveScope } from "./scope.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <ruleset-json> is required.");

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Could not read file: ${file}`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const ruleset = await ctx.client.post<Ruleset>(basePath, body);

  ctx.output.success(`Ruleset created: ${ruleset.id}`);
  ctx.output.detail({
    "ID": ruleset.id,
    "Name": ruleset.name,
    "Kind": ruleset.kind,
    "Phase": ruleset.phase ?? "",
  });
}
