import type { Context, Ruleset } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const accountId = getStringFlag(flags, "accountId");
  const rulesetId = getStringFlag(flags, "ruleset");
  const file = getStringFlag(flags, "file");

  if (!zone && !accountId) throw new UsageError("--zone <zone> or --account-id <id> is required.");
  if (zone && accountId) throw new UsageError("Specify either --zone or --account-id, not both.");
  if (!rulesetId) throw new UsageError("--ruleset <ruleset-id> is required.");
  if (!file) throw new UsageError("--file <rule-json> is required.");

  let basePath: string;
  if (zone) {
    const zoneId = await resolveZoneId(zone, ctx.client);
    basePath = `/zones/${encodeURIComponent(zoneId)}/rulesets`;
  } else {
    basePath = `/accounts/${encodeURIComponent(accountId!)}/rulesets`;
  }

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

  // The API expects rules array to be added to the ruleset
  const ruleset = await ctx.client.post<Ruleset>(
    `${basePath}/${encodeURIComponent(rulesetId)}/rules`,
    body,
  );

  const newRulesCount = ruleset.rules?.length ?? 0;
  ctx.output.success(`Rule added to ruleset ${rulesetId}. Total rules: ${newRulesCount}`);
}
