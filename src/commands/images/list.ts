import type { Context, CFImage, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);
  const page = getNumberFlag(flags, "page");
  const perPage = getNumberFlag(flags, "perPage");

  const params: Record<string, string> = {};
  if (page) params["page"] = String(page);
  if (perPage) params["per_page"] = String(perPage);

  const images = await ctx.client.get<CFImage[]>(
    `/accounts/${encodeURIComponent(accountId)}/images/v1`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "filename", header: "Filename", width: 24 },
    { key: "requireSignedURLs", header: "Signed URLs", width: 12, transform: (v: unknown) => v ? "Yes" : "No" },
    { key: "uploaded", header: "Uploaded", width: 12, transform: (v: unknown) => v ? String(v).slice(0, 10) : "-" },
  ];

  ctx.output.table(images, columns);
}
