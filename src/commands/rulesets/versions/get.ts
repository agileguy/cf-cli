import type { Context, Ruleset } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";
import { resolveScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const rulesetId = getStringFlag(flags, "ruleset");
  const version = getStringFlag(flags, "version");

  if (!rulesetId) throw new UsageError("--ruleset <ruleset-id> is required.");
  if (!version) throw new UsageError("--version <version-number> is required.");

  const ruleset = await ctx.client.get<Ruleset>(
    `${basePath}/${encodeURIComponent(rulesetId)}/versions/${encodeURIComponent(version)}`,
  );

  ctx.output.detail({
    "ID": ruleset.id,
    "Name": ruleset.name,
    "Version": ruleset.version ?? "",
    "Kind": ruleset.kind,
    "Phase": ruleset.phase ?? "",
    "Last Updated": ruleset.last_updated ?? "",
    "Rules": ruleset.rules?.length ?? 0,
  });

  if (ruleset.rules && ruleset.rules.length > 0) {
    ctx.output.json(ruleset.rules);
  }
}
