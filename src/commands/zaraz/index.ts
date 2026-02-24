import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as configGet from "./config-get.js";
import * as configUpdate from "./config-update.js";
import * as publish from "./publish.js";
import * as workflow from "./workflow.js";
import * as historyList from "./history-list.js";
import * as historyGet from "./history-get.js";
import * as exportCmd from "./export.js";

const USAGE = `Usage: cf zaraz <command>

Commands:
  config get      Get Zaraz configuration
  config update   Update Zaraz configuration from JSON file
  publish         Publish Zaraz configuration
  workflow get    Get Zaraz workflow status
  history list    List Zaraz configuration history
  history get     Get a specific history version
  export          Export Zaraz configuration to a file

Flags:
  --zone <zone>       Zone (ID or domain, required)

Run 'cf zaraz <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "config": {
      const [configAction, ...configRest] = rest;
      switch (configAction) {
        case "get":
        case "show":
          return configGet.run(configRest, ctx);
        case "update":
        case "set":
          return configUpdate.run(configRest, ctx);
        default:
          throw new UsageError(`Unknown zaraz config action: "${configAction ?? ""}". Use "get" or "update".`);
      }
    }
    case "publish":
      return publish.run(rest, ctx);
    case "workflow": {
      const [wfAction, ...wfRest] = rest;
      switch (wfAction) {
        case "get":
        case "show":
          return workflow.run(wfRest, ctx);
        default:
          throw new UsageError(`Unknown zaraz workflow action: "${wfAction ?? ""}". Use "get".`);
      }
    }
    case "history": {
      const [histAction, ...histRest] = rest;
      switch (histAction) {
        case "list":
        case "ls":
          return historyList.run(histRest, ctx);
        case "get":
        case "show":
          return historyGet.run(histRest, ctx);
        default:
          throw new UsageError(`Unknown zaraz history action: "${histAction ?? ""}". Use "list" or "get".`);
      }
    }
    case "export":
      return exportCmd.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown zaraz command: "${subcommand}"\n\n${USAGE}`);
  }
}
