import type { Context, ObservatoryTest } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <test-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const test = await ctx.client.get<ObservatoryTest>(
    `/zones/${encodeURIComponent(zoneId)}/speed_api/tests/${encodeURIComponent(id)}`,
  );

  const detail: Record<string, unknown> = {
    "ID": test.id,
    "URL": test.url,
    "Region": test.region ?? "—",
    "Date": test.date ?? "—",
    "Schedule": test.schedule_frequency ?? "—",
  };

  if (test.mobile_report) {
    detail["Mobile Performance"] = test.mobile_report.performance_score ?? "—";
    detail["Mobile FCP"] = test.mobile_report.fcp ?? "—";
    detail["Mobile LCP"] = test.mobile_report.lcp ?? "—";
    detail["Mobile CLS"] = test.mobile_report.cls ?? "—";
    detail["Mobile TBT"] = test.mobile_report.tbt ?? "—";
  }

  if (test.desktop_report) {
    detail["Desktop Performance"] = test.desktop_report.performance_score ?? "—";
    detail["Desktop FCP"] = test.desktop_report.fcp ?? "—";
    detail["Desktop LCP"] = test.desktop_report.lcp ?? "—";
    detail["Desktop CLS"] = test.desktop_report.cls ?? "—";
    detail["Desktop TBT"] = test.desktop_report.tbt ?? "—";
  }

  ctx.output.detail(detail);
}
