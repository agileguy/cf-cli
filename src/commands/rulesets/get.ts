import type { Context, Ruleset } from "../../types/index.js";
import { getStringFlag } from "../../utils/args.js";
import { resolveScope } from "./scope.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <ruleset-id> is required.");

  const ruleset = await ctx.client.get<Ruleset>(
    `${basePath}/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": ruleset.id,
    "Name": ruleset.name,
    "Description": ruleset.description ?? "",
    "Kind": ruleset.kind,
    "Phase": ruleset.phase ?? "",
    "Version": ruleset.version ?? "",
    "Last Updated": ruleset.last_updated ?? "",
    "Rules": ruleset.rules?.length ?? 0,
  });

  if (ruleset.rules && ruleset.rules.length > 0) {
    ctx.output.json(ruleset.rules);
  }
}
