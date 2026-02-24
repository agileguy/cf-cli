import type { Context, AccessCertificate, ColumnDef } from "../../../types/index.js";
import { resolveAccountScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveAccountScope(args, ctx);

  const certs = await ctx.client.get<AccessCertificate[]>(
    `${basePath}/certificates`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "name", header: "Name", width: 30 },
    { key: "fingerprint", header: "Fingerprint", width: 20 },
    {
      key: "associated_hostnames",
      header: "Hostnames",
      width: 30,
      transform: (v: unknown) => Array.isArray(v) ? v.join(", ") : "",
    },
    {
      key: "expires_on",
      header: "Expires",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(certs, columns);
}
