import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as completionRun } from "../../src/commands/completion/index.js";
import { generateBash } from "../../src/commands/completion/bash.js";
import { generateZsh } from "../../src/commands/completion/zsh.js";
import { generateFish } from "../../src/commands/completion/fish.js";

describe("completion bash", () => {
  test("generates valid bash completion script", () => {
    const script = generateBash();
    expect(script).toContain("_cf_completions");
    expect(script).toContain("complete -F _cf_completions cf");
    expect(script).toContain("zones");
    expect(script).toContain("dns");
    expect(script).toContain("accounts");
    expect(script).toContain("user");
    expect(script).toContain("cache");
    expect(script).toContain("config");
    expect(script).toContain("completion");
  });

  test("includes flag completions", () => {
    const script = generateBash();
    expect(script).toContain("--zone");
    expect(script).toContain("--type");
    expect(script).toContain("--name");
    expect(script).toContain("--id");
    expect(script).toContain("--all");
    expect(script).toContain("--yes");
  });
});

describe("completion zsh", () => {
  test("generates valid zsh completion script", () => {
    const script = generateZsh();
    expect(script).toContain("compdef _cf cf");
    expect(script).toContain("_cf()");
    expect(script).toContain("_cf_zones");
    expect(script).toContain("_cf_dns");
    expect(script).toContain("_cf_accounts");
    expect(script).toContain("_cf_user");
    expect(script).toContain("_cf_cache");
    expect(script).toContain("_cf_config");
  });

  test("includes argument types and descriptions", () => {
    const script = generateZsh();
    expect(script).toContain("Zone ID or name");
    expect(script).toContain("Record type");
    expect(script).toContain("Output format");
  });
});

describe("completion fish", () => {
  test("generates valid fish completion script", () => {
    const script = generateFish();
    expect(script).toContain("complete -c cf");
    expect(script).toContain("__cf_no_subcommand");
    expect(script).toContain("__cf_using_command");
    expect(script).toContain("__cf_using_subcommand");
  });

  test("includes all command completions", () => {
    const script = generateFish();
    expect(script).toContain("zones");
    expect(script).toContain("dns");
    expect(script).toContain("accounts");
    expect(script).toContain("user");
    expect(script).toContain("cache");
    expect(script).toContain("config");
    expect(script).toContain("completion");
  });

  test("includes flag completions with descriptions", () => {
    const script = generateFish();
    expect(script).toContain("Zone ID or name");
    expect(script).toContain("Record type");
    expect(script).toContain("Skip confirmation");
  });
});

describe("completion router", () => {
  let stdoutSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stdoutSpy = spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  test("outputs bash completion", async () => {
    const { ctx } = createTestContext();
    await completionRun(["bash"], ctx);
    expect(stdoutSpy).toHaveBeenCalled();
    const output = (stdoutSpy.mock.calls[0]?.[0] as string) ?? "";
    expect(output).toContain("_cf_completions");
  });

  test("outputs zsh completion", async () => {
    const { ctx } = createTestContext();
    await completionRun(["zsh"], ctx);
    expect(stdoutSpy).toHaveBeenCalled();
    const output = (stdoutSpy.mock.calls[0]?.[0] as string) ?? "";
    expect(output).toContain("compdef");
  });

  test("outputs fish completion", async () => {
    const { ctx } = createTestContext();
    await completionRun(["fish"], ctx);
    expect(stdoutSpy).toHaveBeenCalled();
    const output = (stdoutSpy.mock.calls[0]?.[0] as string) ?? "";
    expect(output).toContain("complete -c cf");
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await completionRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown shell", async () => {
    const { ctx } = createTestContext();
    expect(completionRun(["powershell"], ctx)).rejects.toThrow("Unknown shell");
  });
});
