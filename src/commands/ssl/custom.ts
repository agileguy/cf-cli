import type { Context, CustomSSLCertificate, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

const USAGE = `Usage: cf ssl custom <action>

Actions:
  list      List custom SSL certificates
  get       Get a custom SSL certificate
  upload    Upload a custom SSL certificate
  update    Update a custom SSL certificate
  delete    Delete a custom SSL certificate`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "list":
    case "ls":
      return listCerts(rest, ctx);
    case "get":
    case "show":
      return getCert(rest, ctx);
    case "upload":
      return uploadCert(rest, ctx);
    case "update":
      return updateCert(rest, ctx);
    case "delete":
    case "rm":
      return deleteCert(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ssl custom action: "${action}"\n\n${USAGE}`);
  }
}

async function listCerts(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const certs = await ctx.client.get<CustomSSLCertificate[]>(
    `/zones/${encodeURIComponent(zoneId)}/custom_certificates`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "status", header: "Status", width: 12 },
    { key: "issuer", header: "Issuer", width: 24 },
    { key: "hosts", header: "Hosts", transform: (v: unknown) => Array.isArray(v) ? v.join(", ") : String(v ?? "") },
    { key: "expires_on", header: "Expires" },
  ];

  ctx.output.table(certs as unknown as Record<string, unknown>[], columns);
}

async function getCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <certificate-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const cert = await ctx.client.get<CustomSSLCertificate>(
    `/zones/${encodeURIComponent(zoneId)}/custom_certificates/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": cert.id,
    "Status": cert.status,
    "Issuer": cert.issuer,
    "Signature": cert.signature,
    "Hosts": cert.hosts.join(", "),
    "Bundle Method": cert.bundle_method,
    "Uploaded": cert.uploaded_on,
    "Expires": cert.expires_on,
  });
}

async function uploadCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const certFile = getStringFlag(flags, "cert");
  if (!certFile) throw new UsageError("--cert <certificate-file> is required.");

  const keyFile = getStringFlag(flags, "key");
  if (!keyFile) throw new UsageError("--key <private-key-file> is required.");

  let certContent: string;
  try {
    certContent = await Bun.file(certFile).text();
  } catch {
    throw new UsageError(`Cannot read file: "${certFile}".`);
  }

  let keyContent: string;
  try {
    keyContent = await Bun.file(keyFile).text();
  } catch {
    throw new UsageError(`Cannot read file: "${keyFile}".`);
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const cert = await ctx.client.post<CustomSSLCertificate>(
    `/zones/${encodeURIComponent(zoneId)}/custom_certificates`,
    { certificate: certContent, private_key: keyContent },
  );

  ctx.output.success(`Custom certificate uploaded: ${cert.id}`);
  ctx.output.detail({
    "ID": cert.id,
    "Status": cert.status,
    "Hosts": cert.hosts.join(", "),
    "Expires": cert.expires_on,
  });
}

async function updateCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <certificate-id> is required.");

  const certFile = getStringFlag(flags, "cert");
  const keyFile = getStringFlag(flags, "key");

  if (!certFile && !keyFile) throw new UsageError("At least --cert or --key must be provided.");

  const body: Record<string, string> = {};

  if (certFile) {
    try {
      body["certificate"] = await Bun.file(certFile).text();
    } catch {
      throw new UsageError(`Cannot read file: "${certFile}".`);
    }
  }

  if (keyFile) {
    try {
      body["private_key"] = await Bun.file(keyFile).text();
    } catch {
      throw new UsageError(`Cannot read file: "${keyFile}".`);
    }
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const cert = await ctx.client.patch<CustomSSLCertificate>(
    `/zones/${encodeURIComponent(zoneId)}/custom_certificates/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Custom certificate "${id}" updated.`);
  ctx.output.detail({
    "ID": cert.id,
    "Status": cert.status,
    "Hosts": cert.hosts.join(", "),
    "Expires": cert.expires_on,
  });
}

async function deleteCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <certificate-id> is required.");

  const confirmed = await confirm(
    `Delete custom certificate "${id}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  await ctx.client.delete<void>(
    `/zones/${encodeURIComponent(zoneId)}/custom_certificates/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Custom certificate "${id}" deleted.`);
}
