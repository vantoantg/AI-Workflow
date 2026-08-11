# kl-wfl-cli

A lightweight, zero-dependency CLI tool to sync centralized Claude Code workflows, agents, commands, and skills into your project's `.claude` directory.

---

## 🌟 Features

* **Centralized Configuration:** Keep all your shared AI agents, prompt commands, and skill files in one central repository.
* **Conflict Prevention:** Scans your project first and lists any existing files before prompting for overwrite permission.
* **Zero External Dependencies:** Built using native Node.js APIs (`fs`, `path`, `readline`).
* **Cross-Platform:** Works seamlessly across Linux, macOS, and Windows.

---

## 📋 Prerequisites

* **Node.js** v16.7.0 or higher.

---

## 📁 Folder Structure Mapping

Running `kl-wfl-cli` syncs top-level folders from the `WFL` repository into the target project's `.claude/` folder:

```text
WFL Repository                     Target Project
├── agents/            ────────►   └── .claude/
├── commands/          ────────►       ├── agents/
└── skills/            ────────►       ├── commands/
                                       └── skills/
```

---

## 🚀 Usage

You can use `kl-wfl-cli` in any project directory using any of the following methods:

### Method 1: Execute via `npx` (Recommended)

Run directly without installing globally:

```bash
# If published on NPM
npx kl-wfl-cli

# Or run directly from GitHub
npx github:your-username/WFL
```

---

### Method 2: Global CLI Command

If you have installed the package globally or linked it locally:

```bash
kl-wfl
```

---

## 🛡️ Interactive Safety Check

When executing the sync, the CLI scans your project's `.claude/` folder for conflicts:

1. **No conflicts found:** Files are automatically copied to `.claude/`.
2. **Conflicts detected:** The CLI prints a list of conflicting items and prompts for confirmation before making any changes:

```text
🚀 Checking WFL resources...

⚠️  The following items already exist in .claude/:
   - .claude/agents/code-reviewer.md
   - .claude/commands/deploy.sh

❓ Do you want to overwrite these items? (y/N): 
```

* Type `y` or `yes` to proceed with overwriting.
* Press `Enter` or type `n` to safely cancel the operation.

---

## 🛠️ Local Development & Testing

To test and modify the CLI locally on your machine:

1. Clone the `WFL` repository:
   ```bash
   git clone https://github.com/your-username/WFL.git
   cd WFL
   ```

2. Link the package globally:
   ```bash
   npm link
   ```

3. Navigate to any test project and run:
   ```bash
   kl-wfl
   ```

4. To unlink when done:
   ```bash
   # Inside the WFL directory
   npm unlink
   ```

---

## 📄 License

[MIT](LICENSE)
