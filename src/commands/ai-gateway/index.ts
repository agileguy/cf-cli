import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as logs from "./logs/index.js";
import * as datasets from "./datasets/index.js";
import * as evaluations from "./evaluations/index.js";

const USAGE = `Usage: cf ai-gateway <command>

Commands:
  list          List AI gateways
  get           Get gateway details
  create        Create a gateway
  update        Update a gateway
  delete        Delete a gateway
  logs          View gateway logs
  datasets      View gateway datasets
  evaluations   View gateway evaluations

Run 'cf ai-gateway <command> --help' for more information.`;

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
    case "remove":
      return del.run(rest, ctx);
    case "logs":
    case "log":
      return logs.run(rest, ctx);
    case "datasets":
    case "dataset":
      return datasets.run(rest, ctx);
    case "evaluations":
    case "evaluation":
    case "evals":
    case "eval":
      return evaluations.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ai-gateway command: "${subcommand}"\n\n${USAGE}`);
  }
}
