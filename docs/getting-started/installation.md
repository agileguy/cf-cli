# Installation Guide

`cf` is built to be fast, self-contained, and zero-dependency. You can install it using `npm`, `bun`, or build from source.

---

## 1. Global Installation

### Using npm
```bash
npm install -g @agileguy/cf-cli
```

### Using bun
```bash
bun install -g @agileguy/cf-cli
```

---

## 2. Verify Installation

Verify the CLI binary is available on your `$PATH`:

```bash
cf --version
# Output: cf-cli v1.1.2

cf --help
```

---

## 3. Shell Autocompletions

`cf` includes native shell completion generators for Bash, Zsh, and Fish.

### Bash
Add completion to your `.bashrc` or `.bash_profile`:
```bash
cf completion bash >> ~/.bashrc
source ~/.bashrc
```

### Zsh
Add completion to your `.zshrc`:
```bash
cf completion zsh >> ~/.zshrc
source ~/.zshrc
```

### Fish
Save completion script to fish's completion directory:
```bash
mkdir -p ~/.config/fish/completions
cf completion fish > ~/.config/fish/completions/cf.fish
```

---

## 4. Building from Source

If you want to contribute or build the latest unreleased changes:

```bash
# Clone the repository
git clone https://github.com/agileguy/cf-cli.git
cd cf-cli

# Install dependencies (requires Bun)
bun install

# Run the test suite
bun test

# Build the bundled executable
bun run build

# Link globally for development
bun link
```
