import type { Context, Ruleset, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const accountId = getStringFlag(flags, "accountId");

  if (!zone && !accountId) throw new UsageError("--zone <zone> or --account-id <id> is required.");
  if (zone && accountId) throw new UsageError("Specify either --zone or --account-id, not both.");

  let basePath: string;
  if (zone) {
    const zoneId = await resolveZoneId(zone, ctx.client);
    basePath = `/zones/${encodeURIComponent(zoneId)}/rulesets`;
  } else {
    basePath = `/accounts/${encodeURIComponent(accountId!)}/rulesets`;
  }

  // List all rulesets — phases are rulesets with kind "zone" or "managed"
  const rulesets = await ctx.client.get<Ruleset[]>(basePath);

  // Filter to only phase entrypoint rulesets
  const phaseRulesets = rulesets.filter((r) => r.phase);

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "phase", header: "Phase", width: 40 },
    { key: "name", header: "Name", width: 24 },
    { key: "kind", header: "Kind", width: 12 },
    { key: "version", header: "Version", width: 8 },
  ];

  ctx.output.table(phaseRulesets, columns);
}
