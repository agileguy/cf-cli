import { describe, test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, cpSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const REPO_ROOT = join(import.meta.dir, "..");

/**
 * findDocsDir() walks outward from the running script's own location, and
 * that walk is only safe from a real install layout, not from running
 * unbundled source. This builds the actual dist bundle and drops it into a
 * simulated `node_modules` tree — the same shape a reviewer used to confirm
 * the original bug — including a decoy `node_modules/docs` directory that
 * stands in for the real npm package of that name.
 */
describe("findDocsDir in an installed layout", () => {
  test("does not resolve into a colliding node_modules/docs package", () => {
    const build = Bun.spawnSync(["bun", "build", "src/index.ts", "--outfile", "dist/index.js", "--target", "node", "--minify"], {
      cwd: REPO_ROOT,
    });
    expect(build.exitCode).toBe(0);

    const installRoot = mkdtempSync(join(tmpdir(), "cf-cli-install-test-"));
    const homeDir = mkdtempSync(join(tmpdir(), "cf-cli-install-home-"));
    try {
      const pkgDir = join(installRoot, "node_modules", "@agileguy", "cf-cli");
      mkdirSync(join(pkgDir, "dist"), { recursive: true });
      cpSync(join(REPO_ROOT, "dist/index.js"), join(pkgDir, "dist/index.js"));
      cpSync(join(REPO_ROOT, "docs"), join(pkgDir, "docs"), { recursive: true });

      // Stand-in for the real npm package literally named "docs", installed
      // as a sibling dependency — exactly what an outward-first, existence-only
      // search from dist/ can walk straight into.
      mkdirSync(join(installRoot, "node_modules", "docs"), { recursive: true });

      const proc = Bun.spawnSync(["bun", join(pkgDir, "dist/index.js"), "docs", "dns", "--no-pager"], {
        cwd: installRoot,
        env: { ...process.env, HOME: homeDir },
      });

      const stdout = proc.stdout.toString();
      expect(stdout).not.toContain("Documentation file not found");
      expect(stdout).toContain("cf dns");
    } finally {
      rmSync(installRoot, { recursive: true, force: true });
      rmSync(homeDir, { recursive: true, force: true });
    }
  }, 30000);
});
