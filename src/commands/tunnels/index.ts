import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as token from "./token.js";
import * as config from "./config/index.js";
import * as connections from "./connections/index.js";

const USAGE = `Usage: cf tunnels <command>

Commands:
  list        List Cloudflare Tunnels
  get         Get tunnel details
  create      Create a new tunnel
  update      Update a tunnel
  delete      Delete a tunnel
  token       Get a tunnel's token
  config      Manage tunnel configuration (get, update)
  connections Manage tunnel connections (list, delete)

Run 'cf tunnels <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "create":
      return create.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case "token":
      return token.run(rest, ctx);
    case "config":
    case "cfg":
      return config.run(rest, ctx);
    case "connections":
    case "conns":
      return connections.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown tunnels command: "${subcommand}"\n\n${USAGE}`);
  }
}
