import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as analyze from "./analyze.js";
import * as universal from "./universal.js";
import * as advanced from "./advanced.js";
import * as custom from "./custom.js";
import * as clientCerts from "./client-certs.js";
import * as keyless from "./keyless.js";
import * as originCa from "./origin-ca.js";
import * as mtls from "./mtls.js";
import * as verification from "./verification.js";
import * as dcvDelegation from "./dcv-delegation.js";
import * as recommendations from "./recommendations.js";
import * as postQuantum from "./post-quantum.js";

const USAGE = `Usage: cf ssl <command>

Commands:
  analyze         Analyze SSL certificate for a hostname
  universal       Manage Universal SSL settings (get, update)
  advanced        Manage Advanced Certificate Manager (list, order)
  custom          Manage Custom SSL certificates (list, get, upload, update, delete)
  client-certs    Manage Client Certificates (list, create, delete)
  keyless         Manage Keyless SSL servers (list, create, delete)
  origin-ca       Manage Origin CA certificates (list, create, get, revoke)
  mtls            Manage mTLS certificates (list, upload, delete)
  verification    Get SSL verification status
  dcv-delegation  List DCV delegation UUIDs
  recommendations Get SSL/TLS recommendations
  post-quantum    Manage Post-Quantum encryption (get, update)

Run 'cf ssl <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "analyze":
      return analyze.run(rest, ctx);
    case "universal":
      return universal.run(rest, ctx);
    case "advanced":
      return advanced.run(rest, ctx);
    case "custom":
      return custom.run(rest, ctx);
    case "client-certs":
      return clientCerts.run(rest, ctx);
    case "keyless":
      return keyless.run(rest, ctx);
    case "origin-ca":
      return originCa.run(rest, ctx);
    case "mtls":
      return mtls.run(rest, ctx);
    case "verification":
      return verification.run(rest, ctx);
    case "dcv-delegation":
      return dcvDelegation.run(rest, ctx);
    case "recommendations":
      return recommendations.run(rest, ctx);
    case "post-quantum":
      return postQuantum.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ssl command: "${subcommand}"\n\n${USAGE}`);
  }
}
