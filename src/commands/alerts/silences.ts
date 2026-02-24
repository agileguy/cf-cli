import type { Context, AlertSilence, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

const USAGE = `Usage: cf alerts silences <command>

Commands:
  list      List alert silences
  create    Create an alert silence
  delete    Delete an alert silence

Run 'cf alerts silences <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return listCmd(rest, ctx);
    case "create":
    case "add":
      return createCmd(rest, ctx);
    case "delete":
    case "rm":
      return deleteCmd(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown silences command: "${subcommand}"\n\n${USAGE}`);
  }
}

async function listCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const silences = await ctx.client.get<AlertSilence[]>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/silences`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "description", header: "Description", width: 40 },
    { key: "starts_on", header: "Starts", width: 20 },
    { key: "ends_on", header: "Ends", width: 20 },
  ];

  ctx.output.table(silences, columns);
}

async function createCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <silence-json> is required.");

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const silence = await ctx.client.post<AlertSilence>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/silences`,
    body,
  );

  ctx.output.success(`Alert silence created: ${silence.id}`);
  ctx.output.detail({
    "ID": silence.id,
    "Description": silence.description ?? "",
    "Starts On": silence.starts_on ?? "",
    "Ends On": silence.ends_on ?? "",
  });
}

async function deleteCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <silence-id> is required.");

  const confirmed = await confirm(`Delete alert silence "${id}"?`, ctx.flags);
  if (!confirmed) {
    ctx.output.warn("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/silences/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Alert silence "${id}" deleted.`);
}
