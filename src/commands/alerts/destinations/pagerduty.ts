import type { Context, AlertPagerDuty, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

const USAGE = `Usage: cf alerts destinations pagerduty <command>

Commands:
  list      List PagerDuty destinations
  connect   Connect PagerDuty
  delete    Delete a PagerDuty destination

Run 'cf alerts destinations pagerduty <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return listCmd(rest, ctx);
    case "connect":
      return connectCmd(rest, ctx);
    case "delete":
    case "rm":
      return deleteCmd(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown pagerduty command: "${subcommand}"\n\n${USAGE}`);
  }
}

async function listCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const destinations = await ctx.client.get<AlertPagerDuty[]>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/destinations/pagerduty`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "service_id", header: "Service ID", width: 30 },
    { key: "service_name", header: "Service Name", width: 30 },
  ];

  ctx.output.table(destinations, columns);
}

async function connectCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.post<AlertPagerDuty>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/destinations/pagerduty/connect`,
  );

  ctx.output.success("PagerDuty connected.");
  ctx.output.detail({
    "ID": result.id,
    "Name": result.name ?? "",
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
  if (!id) throw new UsageError("--id <pagerduty-id> is required.");

  const confirmed = await confirm(`Delete PagerDuty destination "${id}"?`, ctx.flags);
  if (!confirmed) {
    ctx.output.warn("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/destinations/pagerduty/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`PagerDuty destination "${id}" deleted.`);
}
