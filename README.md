# 🧩 dsh-mcp-skill-ui — MCP 和 Skill 界面插件

在 **DeepSeek Harness (dsh web)** 输入框的「+」/「/」命令菜单里，注册 `mcp`、`plugins`、`skills` 三个命令，让你**不用记路径、不用开设置页**，就能随时查看和管理：

- **MCP 服务**（`/mcp`）—— 列出已配置的 MCP 服务及启用状态
- **Skill 技能**（`/skills`）—— 列出全部已安装 skill 及说明
- **插件**（`/plugins`）—— 列出已安装的用户插件及内置包

配合 DSH 自带的「技能」分组，还能做到**点一下 skill 就把它加进对话框、发送即调用**。

---

## ✨ 具体效果

### 1. 命令菜单里新增三个命令

点输入框左下角「+」（或敲 `/`），「命令」分组中会多出：

| 命令 | 菜单描述 | 无参回车 | 带参 `/xxx <名称>` |
|---|---|---|---|
| `/mcp` | 列出已配置的 MCP 服务 | 全部 MCP 列表（名称/传输/✅启用⛔禁用） | 单个服务详情（命令/地址/状态） |
| `/plugins` | 列出已安装的插件 | 用户插件列表（名称@版本—简介）+ 内置包数量 | 单个插件详情（说明/路径） |
| `/skills` | 列出已安装的 skill | 全部 skill 列表（名称—一句话简介）+ 使用提示 | 单个 skill 的 SKILL.md 全文（自动去 frontmatter、超长截断） |

> 三个命令都带参数提示：在菜单里**点击只是把 `/mcp ` 这类文本插入输入框**（可随意编辑、删除），**回车才执行**——不会误触，也不会在对话里留下删不掉的输出。

### 2. 示例输出

```
> /mcp
已配置的 MCP 服务(2):
• scrapling (stdio) — ⛔已禁用
• http1 (streamable-http) — ✅启用
配置文件: C:\Users\WBB\.dsh\profiles\web\cordis.patch.yml
用法: /mcp <id> 查看详情;开关/删除在「设置 → 插件管理」
```

```
> /skills
已安装 skills(22):
• alpha-expression-json — 生成 WorldQuant BRAIN 平台 alpha 表达式的标准 JSON 格式文件。当需…
• docx — Use this skill whenever the user wants to create, read, edit, or manipulate…
…
💡 快捷用法:点输入框「+」→「技能」分组,直接点击某个 skill 即可把它加入对话框,发送即调用
用法: /skills <名称> 查看完整说明
```

### 3. 技能一键进对话框（点击即用）

点「+」→「技能」分组 → 点击需要的 skill（如 `xlsx`）→ 输入框自动出现 `/xlsx ` → 继续打字或直接回车 → **skill 被调用**。这是 DSH 内置能力（`dsh-client-ui-skill`），本插件把入口打通了（见下方「可选增强」）。

---

## 🚀 安装

> **前提**：已安装 DeepSeek Harness（dsh web），并了解 `~/.dsh` 目录结构。

```bash
# 1. 克隆并放入用户插件目录
git clone https://github.com/yvyicode0127-stack/Dsh-mcp-skill-.git
mkdir -p ~/.dsh/plugins/dsh-command-menu
cp Dsh-mcp-skill-/{index.js,package.json} ~/.dsh/plugins/dsh-command-menu/

# 2. 声明依赖(让 Node 端可解析)
#    编辑 ~/.dsh/profiles/web/package.json,dependencies 加入:
#    "dsh-command-menu": "file:../../plugins/dsh-command-menu"

# 3. 在 ~/.dsh/profiles/web/cordis.patch.yml 的插件列表加入:
#    - insert:
#        - id: command-menu
#          name: dsh-command-menu

# 4. 重启 dsh web,点输入框「+」即可看到 /mcp /plugins /skills
```

> 💡 如果 `pnpm` 可用，也可以走官方方式：
> `dsh plugin --profile web add ~/.dsh/plugins/dsh-command-menu`

---

## 📖 使用教程

### 查看 MCP 服务
- `/mcp` —— 列出所有 MCP 服务、传输方式、启用状态
- `/mcp scrapling` —— 查看指定服务的命令/地址等详情
- 开关/删除 MCP 请在「设置 → 插件管理」（配合 [dsh-plugin-manager](https://github.com/liqichen/dsh-plugin-manager)）

### 查看 Skill
- `/skills` —— 列出全部 skill 及一句话简介
- `/skills pdf` —— 查看该 skill 的完整 SKILL.md 说明
- **快捷调用**：点「+」→「技能」分组 → 点击 skill → 输入框出现 `/skill名` → 发送即调用

### 查看插件
- `/plugins` —— 列出用户插件（`~/.dsh/plugins`）+ 内置包数量
- `/plugins dsh-plugin-manager` —— 查看某个插件的详情与路径

---

## ⚡ 可选增强：「+」按钮也显示技能分组

DSH 原版「+」按钮只打开「命令」分组，技能分组只有键盘敲 `/` 才出现。想让「+」也直接显示技能分组，给输入触发器打一个小补丁（与敲 `/` 的行为完全一致）：

```diff
# 文件: <dsh安装>/node_modules/@deepseek-ai/dsh-client-ui-input-trigger/lib/client.js
# 方法: InputTriggerController.toggleSource
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

生效方式：刷新浏览器页面即可（服务器实时读文件）；若未生效则重启 dsh web。
> ⚠️ 该补丁打在 dsh 安装目录内，**dsh 升级/重装后会丢失**，需重新应用；改前先备份原文件。

---

## 🛠️ 工作原理

纯 Node 端插件，注册 DSH 宿主命令（与官方 `dsh-command-compact` 同款机制）：

```
dsh web 输入框「+」/「/」命令菜单
        │  commands.list / commands.execute
        ▼
dsh-command-menu (index.js, ctx.commands.register)
        │  直接读取
        ▼
~/.dsh/profiles/web/cordis.patch.yml   ← /mcp 数据源
~/.dsh/skills/*/SKILL.md               ← /skills 数据源
~/.dsh/plugins/*/package.json          ← /plugins 数据源
```

零依赖、零额外进程、只读操作，不修改任何配置文件。

---

## ❓ 常见问题

**Q: 菜单里看不到这三个命令？**
重启 dsh web；确认 `cordis.patch.yml` 里已加入插件条目（见安装第 3 步）。

**Q: 点击命令后没反应？**
点击只是把 `/mcp ` 插入输入框，需要再按回车才会执行。

**Q: `/mcp` 显示"未配置 MCP 服务"？**
表示 `cordis.patch.yml` 里还没有 MCP 条目，去「设置 → 插件管理」配置即可。

**Q: 能开关 MCP 吗？**
本插件只读展示；开关/删除请用「设置 → 插件管理」或直接编辑 `cordis.patch.yml`。

---

## 📜 许可证

[MIT](LICENSE)
