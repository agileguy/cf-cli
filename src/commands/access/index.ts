import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as apps from "./apps/index.js";
import * as policies from "./policies/index.js";
import * as serviceTokens from "./service-tokens/index.js";
import * as groups from "./groups/index.js";
import * as users from "./users/index.js";
import * as certificates from "./certificates/index.js";
import * as idps from "./idps/index.js";

const USAGE = `Usage: cf access <command>

Commands:
  apps             Manage Access applications
  policies         Manage Access policies
  service-tokens   Manage Access service tokens
  groups           Manage Access groups
  users            View Access users and sessions
  certificates     Manage Access mTLS certificates
  idps             Manage Access identity providers

Run 'cf access <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "apps":
    case "app":
    case "applications":
      return apps.run(rest, ctx);
    case "policies":
    case "policy":
      return policies.run(rest, ctx);
    case "service-tokens":
    case "service-token":
    case "tokens":
      return serviceTokens.run(rest, ctx);
    case "groups":
    case "group":
      return groups.run(rest, ctx);
    case "users":
    case "user":
      return users.run(rest, ctx);
    case "certificates":
    case "certificate":
    case "certs":
    case "cert":
      return certificates.run(rest, ctx);
    case "idps":
    case "idp":
    case "identity-providers":
      return idps.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown access command: "${subcommand}"\n\n${USAGE}`);
  }
}
