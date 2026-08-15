> 🌐 Language: [English](README.md) · [简体中文](README.zh-CN.md)

# 🧩 dsh-mcp-skill-ui — MCP & Skill Interface Plugin

Registers `mcp`, `plugins`, `skills` commands in the **DeepSeek Harness (dsh web)** input box's `+` / `/` command menu — browse MCP servers, skills, and plugins without leaving the chat:

- **MCP servers** (`/mcp`) — list configured MCP servers and their status
- **Skills** (`/skills`) — list installed skills with descriptions
- **Plugins** (`/plugins`) — list installed user plugins and built-in packages

Together with DSH's built-in "Skills" group, you can **click a skill to add it to the input, then send to invoke it**.

---

## ✨ What You Get

### 1. Three new commands in the menu

Click `+` in the bottom-left of the input (or type `/`) — the "Commands" group now has:

| Command | Menu description | Enter (no args) | `/xxx <name>` |
|---|---|---|---|
| `/mcp` | List configured MCP servers | All MCP servers (name / transport / ✅enabled ⛔disabled) | Single server details (command / URL / status) |
| `/plugins` | List installed plugins | User plugins + built-in package count | Single plugin details (description / path) |
| `/skills` | List installed skills | All skills (name — summary) + usage tip | Full `SKILL.md` of one skill |

> All three commands take an argument hint: clicking in the menu only **inserts editable text** like `/mcp ` into the input; **press Enter to execute** — no accidental execution, nothing un-removable left behind.

### 2. Example output

```
> /mcp
Configured MCP servers (2):
• scrapling (stdio) — ⛔ disabled
• http1 (streamable-http) — ✅ enabled
Config: ~/.dsh/profiles/web/cordis.patch.yml
Usage: /mcp <id> for details; toggle/delete in Settings → Plugin Manager
```

```
> /skills
Installed skills (22):
• alpha-expression-json — Generate standard JSON files for WorldQuant BRAIN alpha expressions…
• docx — Use this skill whenever the user wants to create Word documents…
…
💡 Tip: click "+" → "Skills" group, click a skill to add it to the input, send to invoke
Usage: /skills <name> to view the full SKILL.md
```

*(The exact wording is Chinese when the dsh web UI language is Chinese.)*

### 3. One-click skill invocation

Click `+` → "Skills" group → click a skill (e.g. `xlsx`) → `/xlsx ` appears in the input → press Enter → **the skill is invoked**. This is built-in DSH behavior (`dsh-client-ui-skill`); this plugin opens up the entry point (see "Optional Enhancement").

---

## 🚀 Installation

> **Prerequisites**: DeepSeek Harness (dsh web) installed, familiar with `~/.dsh`.

```bash
# 1. Clone into the user plugins directory
git clone https://github.com/yvyicode0127-stack/Dsh-mcp-skill-.git
mkdir -p ~/.dsh/plugins/dsh-command-menu
cp Dsh-mcp-skill-/{index.js,package.json} ~/.dsh/plugins/dsh-command-menu/

# 2. Declare the dependency — edit ~/.dsh/profiles/web/package.json:
#    "dsh-command-menu": "file:../../plugins/dsh-command-menu"

# 3. Register in ~/.dsh/profiles/web/cordis.patch.yml:
#    - insert:
#        - id: command-menu
#          name: dsh-command-menu

# 4. Restart dsh web, then click "+"
```

> 💡 If `pnpm` is available you can also:
> `dsh plugin --profile web add ~/.dsh/plugins/dsh-command-menu`

---

## 📖 Usage

### MCP servers
- `/mcp` — list all MCP servers with transport & status
- `/mcp scrapling` — show details of one server (by id or serverName)
- Toggle/delete MCP in Settings → Plugin Manager (works with [dsh-plugin-manager](https://github.com/liqichen/dsh-plugin-manager))

### Skills
- `/skills` — list all skills with one-line summaries
- `/skills pdf` — view a skill's full `SKILL.md`
- **Quick invoke**: click `+` → "Skills" group → click a skill → `/name` appears → send

### Plugins
- `/plugins` — list user plugins (`~/.dsh/plugins`) + built-in package count
- `/plugins dsh-plugin-manager` — view one plugin's details & path

---

## ⚡ Optional: show the Skills group in the "+" menu

By default the `+` button only opens the "Commands" group; the "Skills" group appears only when typing `/`. To make `+` show both, apply this small patch to the input-trigger bundle (identical to the typed-`/` path):

```diff
# file: <dsh installation>/node_modules/@deepseek-ai/dsh-client-ui-input-trigger/lib/client.js
# method: InputTriggerController.toggleSource
- const match = this.deps.roster.sources(hit.trigger).find((item) => item.name === source);
+ const roster = this.deps.roster.sources(hit.trigger);
+ const match = roster.find((item) => item.name === source);
  ...
- this.menu.set(seedGroups(this.menu.getSnapshot(), [source]));
+ this.menu.set(seedGroups(this.menu.getSnapshot(), roster.map((item) => item.name)));
  ...
- this.fetchCandidates(hit, [match]);
+ this.fetchCandidates(hit, roster);
```

Take effect: refresh the browser page; if not, restart dsh web.

> ⚠️ The patch lives inside the dsh installation — it is **lost on dsh upgrade/reinstall**; back up the original file first.

---

## 🛠️ How It Works

A pure Node-side plugin that registers DSH host commands (same mechanism as the official `dsh-command-compact`):

```
dsh web input "+" / "/" command menu
        │  commands.list / commands.execute
        ▼
dsh-command-menu (index.js, ctx.commands.register)
        │  reads directly
        ▼
~/.dsh/profiles/web/cordis.patch.yml   ← /mcp data source
~/.dsh/skills/*/SKILL.md               ← /skills data source
~/.dsh/plugins/*/package.json          ← /plugins data source
```

Zero dependencies, no extra process, read-only — modifies nothing.

---

## ❓ FAQ

**Q: Commands not showing in the menu?**
Restart dsh web; verify the plugin entry is in `cordis.patch.yml` (installation step 3).

**Q: Nothing happens after clicking a command?**
Clicking only inserts `/mcp ` into the input; press Enter to execute.

**Q: `/mcp` says no MCP configured?**
There are no MCP entries in `cordis.patch.yml` yet; configure them in Settings → Plugin Manager.

**Q: Can I toggle MCP?**
This plugin is read-only; toggle/delete via Settings → Plugin Manager or edit `cordis.patch.yml`.

---

## 📜 License

[MIT](LICENSE)
