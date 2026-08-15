# 🧩 dsh-mcp-skill-ui — MCP 和 Skill 界面插件 (MCP & Skill Interface Plugin)

在 **DeepSeek Harness (dsh web)** 输入框的「+」/「/」命令菜单里注册 `mcp`、`plugins`、`skills` 三个命令，不用记路径、不用开设置页，就能随时查看：

Registers `mcp`, `plugins`, `skills` commands in the **DeepSeek Harness (dsh web)** input box's `+` / `/` command menu — browse MCP servers, skills, and plugins without leaving the chat:

- **MCP 服务** (`/mcp`) — 列出已配置的 MCP 服务及启用状态 / List configured MCP servers and their status
- **Skill 技能** (`/skills`) — 列出全部已安装 skill 及说明 / List installed skills with descriptions
- **插件** (`/plugins`) — 列出已安装的用户插件及内置包 / List installed user plugins and built-in packages

配合 DSH 自带的「技能」分组，还能**点一下 skill 就把它加进对话框、发送即调用**。

With DSH's built-in "Skills" group, you can **click a skill to add it to the input, then send to invoke it**.

---

## ✨ 具体效果 / What You Get

### 1. 命令菜单新增三个命令 / Three new commands in the menu

点输入框左下角「+」(或敲 `/`)，「命令」分组中多出 / Click `+` (or type `/`), the "Commands" group now has:

| 命令 / Command | 菜单描述 / Menu description | 无参回车 / Enter with no args | 带参 `/xxx <name>` / With an argument |
|---|---|---|---|
| `/mcp` | 列出已配置的 MCP 服务 / List MCP servers | 全部 MCP 列表(名称/传输/✅启用⛔禁用) / All MCP servers (name/transport/✅enabled⛔disabled) | 单个服务详情(命令/地址/状态) / Single server details |
| `/plugins` | 列出已安装的插件 / List installed plugins | 用户插件列表 + 内置包数量 / User plugins + built-in count | 单个插件详情(说明/路径) / Single plugin details |
| `/skills` | 列出已安装的 skill / List installed skills | 全部 skill 列表(名称—简介) + 使用提示 / All skills (name—summary) + tip | 单个 skill 的 SKILL.md 全文 / Full SKILL.md of one skill |

> 三个命令都带参数提示：菜单里**点击只是把 `/mcp ` 文本插入输入框**(可随意编辑、删除)，**回车才执行**——不会误触，也不会在对话里留下删不掉的输出。
>
> All three commands take an argument hint: clicking in the menu only **inserts editable text** like `/mcp ` into the input; **press Enter to execute** — no accidental execution, nothing un-removable left behind.

### 2. 示例输出 / Example Output

```
> /mcp
已配置的 MCP 服务(2):            (Configured MCP servers: 2)
• scrapling (stdio) — ⛔已禁用    (⛔ disabled)
• http1 (streamable-http) — ✅启用 (✅ enabled)
配置文件: C:\Users\WBB\.dsh\profiles\web\cordis.patch.yml
用法: /mcp <id> 查看详情;开关/删除在「设置 → 插件管理」
```

```
> /skills
已安装 skills(22):                        (Installed skills: 22)
• alpha-expression-json — 生成 WorldQuant BRAIN alpha 表达式 JSON…
• docx — Use this skill whenever the user wants to create Word documents…
…
💡 快捷用法:点输入框「+」→「技能」分组,点击 skill 即可加入对话框,发送即调用
用法: /skills <名称> 查看完整说明
```

### 3. 技能一键进对话框 / One-click skill invocation

点「+」→「技能」分组 → 点击 skill(如 `xlsx`)→ 输入框出现 `/xlsx ` → 回车发送 → **skill 被调用**。这是 DSH 内置能力(`dsh-client-ui-skill`)，本插件把入口打通(见「可选增强」)。

Click `+` → "Skills" group → click a skill (e.g. `xlsx`) → `/xlsx ` appears in the input → press Enter → **the skill is invoked**. This is built-in DSH behavior (`dsh-client-ui-skill`); this plugin opens up the entry point (see "Optional Enhancement").

---

## 🚀 安装 / Installation

> **前提 / Prerequisites**: 已安装 DeepSeek Harness (dsh web)，了解 `~/.dsh` 目录结构 / DSH web installed, familiar with `~/.dsh`.

```bash
# 1. 克隆并放入用户插件目录 / Clone into the user plugins directory
git clone https://github.com/yvyicode0127-stack/Dsh-mcp-skill-.git
mkdir -p ~/.dsh/plugins/dsh-command-menu
cp Dsh-mcp-skill-/{index.js,package.json} ~/.dsh/plugins/dsh-command-menu/

# 2. 声明依赖(让 Node 端可解析) / Declare the dependency
#    编辑 ~/.dsh/profiles/web/package.json,dependencies 加入 / edit package.json dependencies:
#    "dsh-command-menu": "file:../../plugins/dsh-command-menu"

# 3. 在 ~/.dsh/profiles/web/cordis.patch.yml 的插件列表加入 / register in cordis.patch.yml:
#    - insert:
#        - id: command-menu
#          name: dsh-command-menu

# 4. 重启 dsh web,点输入框「+」即可看到 / Restart dsh web, then click "+"
```

> 💡 若 `pnpm` 可用，也可 / If `pnpm` is available you can also:
> `dsh plugin --profile web add ~/.dsh/plugins/dsh-command-menu`

---

## 📖 使用教程 / Usage

### 查看 MCP 服务 / MCP servers
- `/mcp` —— 列出所有 MCP 服务、传输方式、启用状态 / list all MCP servers with transport & status
- `/mcp scrapling` —— 查看指定服务详情 / show details of one server (by id or serverName)
- 开关/删除 MCP 请在「设置 → 插件管理」(配合 [dsh-plugin-manager](https://github.com/liqichen/dsh-plugin-manager)) / toggle/delete MCP in Settings → Plugin Manager

### 查看 Skill / Skills
- `/skills` —— 列出全部 skill 及一句话简介 / list all skills with one-line summaries
- `/skills pdf` —— 查看该 skill 的完整 SKILL.md / view a skill's full SKILL.md
- **快捷调用 / Quick invoke**: 点「+」→「技能」分组 → 点击 skill → 输入框出现 `/skill名` → 发送 / click "+" → Skills group → click a skill → `/name` appears → send

### 查看插件 / Plugins
- `/plugins` —— 列出用户插件(`~/.dsh/plugins`)+ 内置包数量 / list user plugins + built-in count
- `/plugins dsh-plugin-manager` —— 查看某个插件详情与路径 / view one plugin's details & path

---

## ⚡ 可选增强:「+」按钮也显示技能分组 / Optional: show the Skills group in the "+" menu

DSH 原版「+」只打开「命令」分组，技能分组只有敲 `/` 才出现。想让「+」也显示技能分组，给输入触发器打一个小补丁(与敲 `/` 行为完全一致)：

By default the "+" button only opens the "Commands" group; the "Skills" group appears only when typing `/`. To make "+" show both, apply this small patch to the input-trigger bundle (identical to the typed-`/` path):

```diff
# 文件 / file: <dsh安装>/node_modules/@deepseek-ai/dsh-client-ui-input-trigger/lib/client.js
# 方法 / method: InputTriggerController.toggleSource
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

生效:刷新浏览器页面即可;若未生效则重启 dsh web。
Take effect: refresh the browser page; if not, restart dsh web.

> ⚠️ 补丁打在 dsh 安装目录内,**dsh 升级/重装后会丢失**,需重新应用;改前先备份原文件。
> ⚠️ The patch lives inside the dsh installation — it is **lost on dsh upgrade/reinstall**; back up the original file first.

---

## 🛠️ 工作原理 / How It Works

纯 Node 端插件，注册 DSH 宿主命令(与官方 `dsh-command-compact` 同款机制)：

A pure Node-side plugin that registers DSH host commands (same mechanism as the official `dsh-command-compact`):

```
dsh web 输入框「+」/「/」命令菜单 (command menu)
        │  commands.list / commands.execute
        ▼
dsh-command-menu (index.js, ctx.commands.register)
        │  reads directly
        ▼
~/.dsh/profiles/web/cordis.patch.yml   ← /mcp data source
~/.dsh/skills/*/SKILL.md               ← /skills data source
~/.dsh/plugins/*/package.json          ← /plugins data source
```

零依赖、零额外进程、只读操作，不修改任何配置文件。
Zero dependencies, no extra process, read-only — modifies nothing.

---

## ❓ 常见问题 / FAQ

**Q: 菜单里看不到这三个命令? / Commands not showing in the menu?**
重启 dsh web;确认 `cordis.patch.yml` 已加入插件条目(见安装第 3 步)。
Restart dsh web; verify the plugin entry is in `cordis.patch.yml` (installation step 3).

**Q: 点击命令后没反应? / Nothing happens after clicking a command?**
点击只是把 `/mcp ` 插入输入框，需要再按回车执行。
Clicking only inserts `/mcp ` into the input; press Enter to execute.

**Q: `/mcp` 显示"未配置 MCP 服务"? / "/mcp" says no MCP configured?**
表示 `cordis.patch.yml` 里还没有 MCP 条目，去「设置 → 插件管理」配置。
There are no MCP entries in `cordis.patch.yml` yet; configure them in Settings → Plugin Manager.

**Q: 能开关 MCP 吗? / Can I toggle MCP?**
本插件只读展示;开关/删除请用「设置 → 插件管理」或直接编辑 `cordis.patch.yml`。
This plugin is read-only; toggle/delete via Settings → Plugin Manager or edit `cordis.patch.yml`.

---

## 📜 许可证 / License

[MIT](LICENSE)
