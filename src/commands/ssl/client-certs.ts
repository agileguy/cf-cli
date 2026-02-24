import type { Context, ClientCertificate, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

const USAGE = `Usage: cf ssl client-certs <action>

Actions:
  list      List client certificates
  create    Create a client certificate
  delete    Delete a client certificate`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "list":
    case "ls":
      return listCerts(rest, ctx);
    case "create":
      return createCert(rest, ctx);
    case "delete":
    case "rm":
      return deleteCert(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ssl client-certs action: "${action}"\n\n${USAGE}`);
  }
}

async function listCerts(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const certs = await ctx.client.get<ClientCertificate[]>(
    `/zones/${encodeURIComponent(zoneId)}/client_certificates`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "status", header: "Status", width: 12 },
    { key: "fingerprint_sha256", header: "Fingerprint", width: 24 },
    { key: "expires_on", header: "Expires" },
  ];

  ctx.output.table(certs as unknown as Record<string, unknown>[], columns);
}

async function createCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const csrFile = getStringFlag(flags, "csr");
  if (!csrFile) throw new UsageError("--csr <csr-file> is required.");

  const validity = getNumberFlag(flags, "validity") ?? 3650;

  let csrContent: string;
  try {
    csrContent = await Bun.file(csrFile).text();
  } catch {
    throw new UsageError(`Cannot read file: "${csrFile}".`);
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const cert = await ctx.client.post<ClientCertificate>(
    `/zones/${encodeURIComponent(zoneId)}/client_certificates`,
    { csr: csrContent, validity_days: validity },
  );

  ctx.output.success(`Client certificate created: ${cert.id}`);
  ctx.output.detail({
    "ID": cert.id,
    "Status": cert.status,
    "Expires": cert.expires_on ?? "",
  });
}

async function deleteCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <certificate-id> is required.");

  const confirmed = await confirm(
    `Delete client certificate "${id}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  await ctx.client.delete<void>(
    `/zones/${encodeURIComponent(zoneId)}/client_certificates/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Client certificate "${id}" deleted.`);
}
