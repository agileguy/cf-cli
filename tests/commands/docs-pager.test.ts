import { describe, test, expect, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, chmodSync, readFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { shouldDisablePager, splitPagerCommand, displayOutput } from "../../src/commands/docs/index.js";

describe("shouldDisablePager", () => {
  // Probed against the flags shape parseArgs actually produces for each invocation.
  test("pager is on by default (no --pager / --no-pager given)", () => {
    expect(shouldDisablePager({}, undefined)).toBe(false);
  });

  test("--pager keeps the pager on", () => {
    expect(shouldDisablePager({ pager: true }, undefined)).toBe(false);
  });

  test("--no-pager turns the pager off", () => {
    expect(shouldDisablePager({ pager: false }, undefined)).toBe(true);
  });

  test("--noPager (alternate spelling) turns the pager off", () => {
    expect(shouldDisablePager({ noPager: true }, undefined)).toBe(true);
  });

  test("--quiet turns the pager off", () => {
    expect(shouldDisablePager({}, true)).toBe(true);
  });
});

describe("splitPagerCommand", () => {
  test("splits a bare command with no arguments", () => {
    expect(splitPagerCommand("less")).toEqual({ bin: "less", args: [] });
  });

  test("splits a command with arguments (the common $PAGER='less -R' case)", () => {
    expect(splitPagerCommand("less -R")).toEqual({ bin: "less", args: ["-R"] });
  });

  test("tolerates extra whitespace", () => {
    expect(splitPagerCommand("  most   -s  ")).toEqual({ bin: "most", args: ["-s"] });
  });
});

describe("displayOutput", () => {
  const originalIsTTY = process.stdout.isTTY;
  const originalPager = process.env["PAGER"];
  const originalPath = process.env["PATH"];
  const tempDirs: string[] = [];

  afterEach(() => {
    process.stdout.isTTY = originalIsTTY;
    if (originalPager === undefined) delete process.env["PAGER"];
    else process.env["PAGER"] = originalPager;
    if (originalPath === undefined) delete process.env["PATH"];
    else process.env["PATH"] = originalPath;
    while (tempDirs.length) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  function makeScript(name: string, contents: string): string {
    const dir = mkdtempSync(join(tmpdir(), "cf-cli-pager-test-"));
    tempDirs.push(dir);
    const scriptPath = join(dir, name);
    writeFileSync(scriptPath, `#!/bin/sh\n${contents}\n`);
    chmodSync(scriptPath, 0o755);
    return dir;
  }

  test("writes directly to stdout when not a TTY, without spawning anything", async () => {
    process.stdout.isTTY = false;
    process.env["PAGER"] = "definitely-not-a-real-binary-should-never-be-invoked";

    const writes: string[] = [];
    const origWrite = process.stdout.write;
    process.stdout.write = ((chunk: string) => {
      writes.push(chunk);
      return true;
    }) as unknown as typeof process.stdout.write;

    try {
      await displayOutput("hello", false);
    } finally {
      process.stdout.write = origWrite;
    }

    expect(writes.join("")).toContain("hello");
  });

  test("falls back to stdout instead of crashing when $PAGER does not exist", async () => {
    process.stdout.isTTY = true;
    process.env["PAGER"] = "cf-cli-test-nonexistent-pager-binary-xyz";

    const writes: string[] = [];
    const origWrite = process.stdout.write;
    process.stdout.write = ((chunk: string) => {
      writes.push(chunk);
      return true;
    }) as unknown as typeof process.stdout.write;

    try {
      await displayOutput("fallback content", false);
    } finally {
      process.stdout.write = origWrite;
    }

    expect(writes.join("")).toContain("fallback content");
  });

  test("splits a $PAGER with arguments (e.g. 'less -R') into command + args and invokes it", async () => {
    // A fake "less" placed first on PATH so we exercise real PATH-based
    // spawn resolution without needing the real `less` binary to behave
    // predictably under a non-interactive test runner.
    const markerFile = join(tmpdir(), `cf-cli-pager-marker-${Date.now()}.txt`);
    const dir = makeScript("less", `printf '%s\\n' "$@" > "${markerFile}"\ncat >> "${markerFile}"\n`);
    process.env["PATH"] = `${dir}:${process.env["PATH"] ?? ""}`;
    process.env["PAGER"] = "less -R";
    process.stdout.isTTY = true;

    try {
      await displayOutput("paged content", false);
      expect(existsSync(markerFile)).toBe(true);
      const captured = readFileSync(markerFile, "utf8");
      expect(captured).toContain("-R");
      expect(captured).toContain("paged content");
    } finally {
      rmSync(markerFile, { force: true });
    }
  });

  test("does not crash when the pager exits early, closing the pipe (EPIPE)", async () => {
    // Reads a handful of bytes then exits, guaranteeing the read end of the
    // pipe closes while a large write is still being flushed.
    const dir = makeScript("early-exit-pager", `head -c 10 > /dev/null\nexit 0\n`);
    process.env["PATH"] = `${dir}:${process.env["PATH"] ?? ""}`;
    process.env["PAGER"] = "early-exit-pager";
    process.stdout.isTTY = true;

    const largeText = "x".repeat(5 * 1024 * 1024);

    // If EPIPE isn't handled, the child.stdin 'error' event has no listener
    // and Node/Bun crashes the process — which would fail this test file.
    await expect(displayOutput(largeText, false)).resolves.toBeUndefined();
  });
});
