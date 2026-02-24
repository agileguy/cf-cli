import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";
import { generateBash } from "./bash.js";
import { generateZsh } from "./zsh.js";
import { generateFish } from "./fish.js";

const USAGE = `Usage: cf completion <shell>

Shells:
  bash      Generate bash completion script
  zsh       Generate zsh completion script
  fish      Generate fish completion script

Installation:
  bash:  cf completion bash >> ~/.bashrc
  zsh:   cf completion zsh >> ~/.zshrc
  fish:  cf completion fish > ~/.config/fish/completions/cf.fish`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [shell] = args;

  switch (shell) {
    case "bash":
      process.stdout.write(generateBash());
      return;
    case "zsh":
      process.stdout.write(generateZsh());
      return;
    case "fish":
      process.stdout.write(generateFish());
      return;
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown shell: "${shell}". Supported: bash, zsh, fish`);
  }
}
