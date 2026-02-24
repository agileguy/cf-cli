import type { Context, KeylessSSLServer, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

const USAGE = `Usage: cf ssl keyless <action>

Actions:
  list      List Keyless SSL servers
  create    Create a Keyless SSL server
  delete    Delete a Keyless SSL server`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "list":
    case "ls":
      return listServers(rest, ctx);
    case "create":
      return createServer(rest, ctx);
    case "delete":
    case "rm":
      return deleteServer(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ssl keyless action: "${action}"\n\n${USAGE}`);
  }
}

async function listServers(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const servers = await ctx.client.get<KeylessSSLServer[]>(
    `/zones/${encodeURIComponent(zoneId)}/keyless_certificates`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 20 },
    { key: "host", header: "Host", width: 24 },
    { key: "port", header: "Port", width: 8 },
    { key: "status", header: "Status", width: 12 },
    { key: "enabled", header: "Enabled", width: 8, transform: (v: unknown) => (v as boolean) ? "Yes" : "No" },
  ];

  ctx.output.table(servers as unknown as Record<string, unknown>[], columns);
}

async function createServer(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const host = getStringFlag(flags, "host");
  if (!host) throw new UsageError("--host <hostname> is required.");

  const port = getNumberFlag(flags, "port");
  if (!port) throw new UsageError("--port <port> is required.");

  const certFile = getStringFlag(flags, "certificate");
  if (!certFile) throw new UsageError("--certificate <cert-file> is required.");

  let certContent: string;
  try {
    certContent = await Bun.file(certFile).text();
  } catch {
    throw new UsageError(`Cannot read file: "${certFile}".`);
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const server = await ctx.client.post<KeylessSSLServer>(
    `/zones/${encodeURIComponent(zoneId)}/keyless_certificates`,
    { host, port, certificate: certContent },
  );

  ctx.output.success(`Keyless SSL server created: ${server.id}`);
  ctx.output.detail({
    "ID": server.id,
    "Name": server.name,
    "Host": server.host,
    "Port": server.port,
    "Status": server.status,
  });
}

async function deleteServer(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <server-id> is required.");

  const confirmed = await confirm(
    `Delete Keyless SSL server "${id}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  await ctx.client.delete<void>(
    `/zones/${encodeURIComponent(zoneId)}/keyless_certificates/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Keyless SSL server "${id}" deleted.`);
}
