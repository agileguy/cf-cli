import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as http from "./http.js";
import * as dns from "./dns.js";
import * as bgp from "./bgp.js";
import * as attacks from "./attacks.js";
import * as bots from "./bots.js";
import * as email from "./email.js";
import * as asCmd from "./as.js";
import * as locations from "./locations.js";
import * as datasets from "./datasets.js";
import * as annotations from "./annotations.js";

const USAGE = `Usage: cf radar <command>

Commands:
  http          HTTP traffic summary
  dns           DNS traffic summary
  bgp           BGP routing summary
  attacks       Attack traffic summary
  bots          Verified bots summary
  email         Email security summary
  as            Get ASN details
  locations     List locations
  datasets      List datasets
  annotations   List annotations

Run 'cf radar <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "http":
      return http.run(rest, ctx);
    case "dns":
      return dns.run(rest, ctx);
    case "bgp":
      return bgp.run(rest, ctx);
    case "attacks":
      return attacks.run(rest, ctx);
    case "bots":
      return bots.run(rest, ctx);
    case "email":
      return email.run(rest, ctx);
    case "as":
      return asCmd.run(rest, ctx);
    case "locations":
      return locations.run(rest, ctx);
    case "datasets":
      return datasets.run(rest, ctx);
    case "annotations":
      return annotations.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown radar command: "${subcommand}"\n\n${USAGE}`);
  }
}
