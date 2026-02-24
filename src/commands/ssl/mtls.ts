import type { Context, MTLSCertificateAssociation, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

const USAGE = `Usage: cf ssl mtls <action>

Actions:
  list      List mTLS certificate associations
  upload    Upload an mTLS certificate
  delete    Delete an mTLS certificate`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "list":
    case "ls":
      return listCerts(rest, ctx);
    case "upload":
      return uploadCert(rest, ctx);
    case "delete":
    case "rm":
      return deleteCert(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ssl mtls action: "${action}"\n\n${USAGE}`);
  }
}

async function listCerts(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = getStringFlag(flags, "accountId");
  if (!accountId) throw new UsageError("--account-id <account-id> is required.");

  const certs = await ctx.client.get<MTLSCertificateAssociation[]>(
    `/accounts/${encodeURIComponent(accountId)}/mtls_certificates`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 20 },
    { key: "issuer", header: "Issuer", width: 20 },
    { key: "expires_on", header: "Expires" },
  ];

  ctx.output.table(certs as unknown as Record<string, unknown>[], columns);
}

async function uploadCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = getStringFlag(flags, "accountId");
  if (!accountId) throw new UsageError("--account-id <account-id> is required.");

  const certFile = getStringFlag(flags, "cert");
  if (!certFile) throw new UsageError("--cert <certificate-file> is required.");

  let certContent: string;
  try {
    certContent = await Bun.file(certFile).text();
  } catch {
    throw new UsageError(`Cannot read file: "${certFile}".`);
  }

  const body: Record<string, string> = { ca: certContent };

  const keyFile = getStringFlag(flags, "privateKey");
  if (keyFile) {
    try {
      body["private_key"] = await Bun.file(keyFile).text();
    } catch {
      throw new UsageError(`Cannot read file: "${keyFile}".`);
    }
  }

  const cert = await ctx.client.post<MTLSCertificateAssociation>(
    `/accounts/${encodeURIComponent(accountId)}/mtls_certificates`,
    body,
  );

  ctx.output.success(`mTLS certificate uploaded: ${cert.id}`);
  ctx.output.detail({
    "ID": cert.id,
    "Name": cert.name ?? "",
    "Issuer": cert.issuer ?? "",
    "Expires": cert.expires_on ?? "",
  });
}

async function deleteCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = getStringFlag(flags, "accountId");
  if (!accountId) throw new UsageError("--account-id <account-id> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <certificate-id> is required.");

  const confirmed = await confirm(
    `Delete mTLS certificate "${id}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/mtls_certificates/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`mTLS certificate "${id}" deleted.`);
}
