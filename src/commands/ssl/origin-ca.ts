import type { Context, OriginCACertificate, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getListFlag, getNumberFlag } from "../../utils/args.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

const USAGE = `Usage: cf ssl origin-ca <action>

Actions:
  list      List Origin CA certificates
  create    Create an Origin CA certificate
  get       Get an Origin CA certificate
  revoke    Revoke an Origin CA certificate`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "list":
    case "ls":
      return listCerts(rest, ctx);
    case "create":
      return createCert(rest, ctx);
    case "get":
    case "show":
      return getCert(rest, ctx);
    case "revoke":
      return revokeCert(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ssl origin-ca action: "${action}"\n\n${USAGE}`);
  }
}

async function listCerts(args: string[], ctx: Context): Promise<void> {
  const { flags: _flags } = parseArgs(args);

  const certs = await ctx.client.get<OriginCACertificate[]>(
    "/certificates",
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "hostnames", header: "Hostnames", transform: (v: unknown) => Array.isArray(v) ? v.join(", ") : String(v ?? "") },
    { key: "request_type", header: "Type", width: 16 },
    { key: "expires_on", header: "Expires" },
  ];

  ctx.output.table(certs as unknown as Record<string, unknown>[], columns);
}

async function createCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const csrFile = getStringFlag(flags, "csr");
  if (!csrFile) throw new UsageError("--csr <csr-file> is required.");

  const hostnames = getListFlag(flags, "hostnames");
  if (!hostnames || hostnames.length === 0) throw new UsageError("--hostnames <host1,host2,...> is required.");

  const days = getNumberFlag(flags, "days") ?? 5475;

  let csrContent: string;
  try {
    csrContent = await Bun.file(csrFile).text();
  } catch {
    throw new UsageError(`Cannot read file: "${csrFile}".`);
  }

  const cert = await ctx.client.post<OriginCACertificate>(
    "/certificates",
    { csr: csrContent, hostnames, requested_validity: days, request_type: "origin-rsa" },
  );

  ctx.output.success(`Origin CA certificate created: ${cert.id}`);
  ctx.output.detail({
    "ID": cert.id,
    "Hostnames": cert.hostnames.join(", "),
    "Expires": cert.expires_on,
    "Validity": `${cert.requested_validity} days`,
  });
}

async function getCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <certificate-id> is required.");

  const cert = await ctx.client.get<OriginCACertificate>(
    `/certificates/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": cert.id,
    "Hostnames": cert.hostnames.join(", "),
    "Type": cert.request_type,
    "Validity": `${cert.requested_validity} days`,
    "Expires": cert.expires_on,
  });
}

async function revokeCert(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <certificate-id> is required.");

  const confirmed = await confirm(
    `Revoke Origin CA certificate "${id}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/certificates/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Origin CA certificate "${id}" revoked.`);
}
