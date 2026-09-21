import { describe, test, expect } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/**
 * These tests exercise src/index.ts as a real subprocess. The module runs
 * `main()` unconditionally at import time, so it can't be unit-tested via a
 * plain import — a subprocess is the only way to observe its top-level
 * argv routing without actually hitting the Cloudflare API.
 */

const REPO_ROOT = join(import.meta.dir, "..");

/** Run the CLI with an isolated HOME (no ~/.cf/config.json) and no auth env vars. */
function runCli(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const isolatedHome = mkdtempSync(join(tmpdir(), "cf-cli-test-"));
  try {
    const env = { ...process.env, HOME: isolatedHome };
    for (const key of ["CF_API_TOKEN", "CLOUDFLARE_API_TOKEN", "CF_API_KEY", "CF_API_EMAIL", "CF_PROFILE"]) {
      delete env[key];
    }

    const proc = Bun.spawnSync(["bun", "run", "src/index.ts", ...args], {
      cwd: REPO_ROOT,
      env,
    });

    return {
      stdout: proc.stdout.toString(),
      stderr: proc.stderr.toString(),
      exitCode: proc.exitCode ?? 1,
    };
  } finally {
    rmSync(isolatedHome, { recursive: true, force: true });
  }
}

describe("global --version routing", () => {
  test("bare --version prints the version", () => {
    const { stdout, exitCode } = runCli(["--version"]);
    expect(stdout).toContain("cf-cli v");
    expect(exitCode).toBe(0);
  });

  test("bare -v prints the version", () => {
    const { stdout, exitCode } = runCli(["-v"]);
    expect(stdout).toContain("cf-cli v");
    expect(exitCode).toBe(0);
  });

  test("does not hijack a subcommand that carries its own --version flag", () => {
    const { stdout, stderr } = runCli([
      "rulesets",
      "versions",
      "get",
      "--zone",
      "example.com",
      "--ruleset-id",
      "abc",
      "--version",
      "3",
    ]);

    // With no credentials configured, the command should fail on auth,
    // proving it was actually routed instead of being swallowed by the
    // global version check.
    expect(stdout).not.toContain("cf-cli v");
    expect(stderr).toContain("No authentication credentials found");
  });

  test("does not hijack zaraz history-get's --version flag", () => {
    const { stdout, stderr } = runCli(["zaraz", "history-get", "--zone", "example.com", "--version", "5"]);

    expect(stdout).not.toContain("cf-cli v");
    expect(stderr).toContain("No authentication credentials found");
  });
});

describe("--help never reaches a leaf command's real implementation", () => {
  test("group-level --help still shows usage (must keep working)", () => {
    const { stdout, exitCode } = runCli(["kv", "--help"]);
    expect(stdout).toContain("Usage: cf kv <command>");
    expect(exitCode).toBe(0);
  });

  test("a trailing --help on a leaf command shows usage instead of running it", () => {
    // No credentials are configured (see runCli), so if this reached the
    // real "zones list" implementation it would crash trying to call
    // ctx.client.get() on the null client used for the help/no-auth bypass
    // — or, with real credentials configured, it would make a live API call.
    const { stdout, stderr, exitCode } = runCli(["zones", "list", "--help"]);
    expect(stdout).toContain("Usage: cf zones <command>");
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
  });

  test("--help after a leaf command's own flags still shows usage instead of running it", () => {
    const { stdout, stderr, exitCode } = runCli(["dns", "list", "--zone", "example.com", "--help"]);
    expect(stdout).toContain("Usage: cf dns <command>");
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
  });

  test("-h behaves the same as --help on a leaf command", () => {
    const { stdout, stderr, exitCode } = runCli(["zones", "get", "-h"]);
    expect(stdout).toContain("Usage: cf zones <command>");
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
  });
});
