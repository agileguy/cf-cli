import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as rules from "./rules/index.js";
import * as versions from "./versions/index.js";
import * as phases from "./phases/index.js";

const USAGE = `Usage: cf rulesets <command>

Commands:
  list        List rulesets for a zone or account
  get         Get a specific ruleset
  create      Create a new ruleset
  update      Update a ruleset
  delete      Delete a ruleset
  rules       Manage rules within a ruleset
  versions    View ruleset versions
  phases      View phase entrypoints

Run 'cf rulesets <command> --help' for more information.`;

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
    case "add":
      return create.run(rest, ctx);
    case "update":
    case "set":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "rules":
    case "rule":
      return rules.run(rest, ctx);
    case "versions":
    case "version":
      return versions.run(rest, ctx);
    case "phases":
    case "phase":
      return phases.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown rulesets command: "${subcommand}"\n\n${USAGE}`);
  }
}
