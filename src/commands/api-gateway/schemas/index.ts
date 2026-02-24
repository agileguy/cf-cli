import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as upload from "./upload.js";
import * as get from "./get.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf api-gateway schemas <command>

Commands:
  list        List API Gateway schemas
  upload      Upload an OpenAPI schema
  get         Get a schema by ID
  delete      Delete a schema

Run 'cf api-gateway schemas <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "upload":
    case "add":
      return upload.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown api-gateway schemas command: "${subcommand}"\n\n${USAGE}`);
  }
}
