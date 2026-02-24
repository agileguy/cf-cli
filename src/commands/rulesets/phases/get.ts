import type { Context, Ruleset } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";
import { resolveScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const phase = getStringFlag(flags, "phase");

  if (!phase) throw new UsageError("--phase <phase-name> is required.");

  const ruleset = await ctx.client.get<Ruleset>(
    `${basePath}/phases/${encodeURIComponent(phase)}/entrypoint`,
  );

  ctx.output.detail({
    "ID": ruleset.id,
    "Name": ruleset.name,
    "Phase": ruleset.phase ?? phase,
    "Kind": ruleset.kind,
    "Version": ruleset.version ?? "",
    "Last Updated": ruleset.last_updated ?? "",
    "Rules": ruleset.rules?.length ?? 0,
  });

  if (ruleset.rules && ruleset.rules.length > 0) {
    ctx.output.json(ruleset.rules);
  }
}
