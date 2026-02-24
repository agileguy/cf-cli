import type { Context, CFImageVariant, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const result = await ctx.client.get<Record<string, CFImageVariant>>(
    `/accounts/${encodeURIComponent(accountId)}/images/v1/variants`,
  );

  // API returns variants as an object keyed by variant ID
  const variants: CFImageVariant[] = Object.entries(result).map(([id, v]) => ({ ...v, id }));

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 20 },
    { key: "options", header: "Fit", width: 12, transform: (v: unknown) => {
      const o = v as CFImageVariant["options"];
      return o?.fit ?? "-";
    }},
    { key: "options", header: "Width", width: 8, transform: (v: unknown) => {
      const o = v as CFImageVariant["options"];
      return o?.width != null ? String(o.width) : "-";
    }},
    { key: "options", header: "Height", width: 8, transform: (v: unknown) => {
      const o = v as CFImageVariant["options"];
      return o?.height != null ? String(o.height) : "-";
    }},
    { key: "neverRequireSignedURLs", header: "Public", width: 8, transform: (v: unknown) => v ? "Yes" : "No" },
  ];

  ctx.output.table(variants, columns);
}
