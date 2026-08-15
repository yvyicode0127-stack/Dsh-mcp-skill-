/**
 * dsh-command-menu — node half.(MCP 和 Skill 界面插件)
 *
 * 在 dsh web 输入框的「+」/「/」命令菜单里注册三个宿主命令:
 *   /mcp     [id]  — 列出已配置的 MCP 服务(带参数时显示某个服务详情)
 *   /plugins [名称] — 列出已安装的用户插件(带参数时显示某个插件详情)
 *   /skills  [名称] — 列出已安装的 skill(带参数时显示某个 skill 的 SKILL.md 全文)
 *
 * 三个命令都带 input 提示:在菜单里点击只会把 "/mcp "/"/plugins "/"/skills "
 * 插入输入框(可随意编辑、删除),回车才执行 —— 不会误触、不会留下删不掉的输出。
 * 输出保持紧凑:列表只显示「名称 — 一句话简介」,详情用 /xxx <名称> 查看。
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const name = "dsh-command-menu";
export const inject = ["commands"];

const HOME = homedir();
const USER_PLUGINS_DIR = join(HOME, ".dsh/plugins");
const SKILLS_DIR = join(HOME, ".dsh/skills");
const BUILTIN_PLUGINS_DIR = join(HOME, ".dsh/profiles/node_modules/@deepseek-ai");
const PATCH_FILE = join(HOME, ".dsh/profiles/web/cordis.patch.yml");

/** 按显示宽度截断,过长补 "…"。 */
function clip(text, max) {
  const t = String(text).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

/** 安全读取 JSON;失败返回 null。 */
function readJsonSafe(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** 列出 ~/.dsh/plugins 下的用户插件。 */
function listUserPlugins() {
  if (!existsSync(USER_PLUGINS_DIR)) return [];
  return readdirSync(USER_PLUGINS_DIR).sort().flatMap((entry) => {
    const dir = join(USER_PLUGINS_DIR, entry);
    if (!statSync(dir).isDirectory()) return [];
    const meta = readJsonSafe(join(dir, "package.json"));
    if (!meta) return [];
    return [{
      name: meta.name || entry,
      version: meta.version || "",
      description: meta.description || "",
      path: dir
    }];
  });
}

/** 列出 ~/.dsh/skills 下的 skill(跳过 .trash-* 回收站目录)。 */
function listSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR).sort().flatMap((entry) => {
    const dir = join(SKILLS_DIR, entry);
    if (!statSync(dir).isDirectory() || entry.startsWith(".trash-")) return [];
    let description = "";
    const md = join(dir, "SKILL.md");
    if (existsSync(md)) {
      const head = readFileSync(md, "utf8").slice(0, 4000);
      const m = head.match(/^description:\s*(.+)$/m);
      if (m) description = m[1].trim().replace(/^['"]|['"]$/g, "");
    }
    return [{ name: entry, description, path: dir }];
  });
}

/** 内置 @deepseek-ai 插件包数量(只读统计)。 */
function listBuiltinCount() {
  if (!existsSync(BUILTIN_PLUGINS_DIR)) return 0;
  return readdirSync(BUILTIN_PLUGINS_DIR)
    .filter((n) => statSync(join(BUILTIN_PLUGINS_DIR, n)).isDirectory())
    .length;
}

/** 去掉 SKILL.md 开头的 YAML frontmatter(--- 块)。 */
function stripFrontmatter(body) {
  if (body.startsWith("---")) {
    const end = body.indexOf("\n---", 3);
    if (end !== -1) return body.slice(end + 4).replace(/^\n+/, "");
  }
  return body;
}

/**
 * 解析 cordis.patch.yml 里的 MCP 服务条目。
 * 兼容两种书写位置:顶层条目(`- id: x` + name: dsh-mcp-client)与
 * insert 块内条目(`- insert:` 下的 4 空格缩进条目)。
 * 判定规则:条目含 serverName 字段,或其 name 指向 mcp-client ——
 * 这样插件条目(如 dsh-plugin-manager)不会被误判为 MCP 服务。
 */
function parseMcpEntries(text) {
  const lines = text.split("\n");
  const entries = [];
  let cur = null;
  let curIndent = -1;
  const flush = () => {
    if (cur && (cur.serverName || String(cur.name || "").includes("mcp-client"))) {
      delete cur.start;
      entries.push(cur);
    }
    cur = null;
    curIndent = -1;
  };
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const m = ln.match(/^(\s*)- id: (\S+)\s*$/);
    if (m) {
      if (cur) flush();
      cur = { id: m[2], disabled: false };
      curIndent = m[1].length;
      continue;
    }
    if (cur) {
      const indent = ln.match(/^\s*/)[0].length;
      if (ln.trim() === "" || indent <= curIndent) {
        flush();
        continue;
      }
      if (/^\s+disabled:\s*true\s*$/.test(ln)) cur.disabled = true;
      for (const key of ["name", "serverName", "transport", "command"]) {
        const mm = ln.match(new RegExp("^\\s+" + key + ":\\s*(.+?)\\s*$"));
        if (mm && !(key in cur)) cur[key] = mm[1].replace(/^['"]|['"]$/g, "");
      }
      const mu = ln.match(/^\s+url:\s*(.+?)\s*$/);
      if (mu && !("url" in cur)) cur.url = mu[1].length > 60 ? mu[1].slice(0, 60) + "…" : mu[1];
    }
  }
  flush();
  return entries;
}

/** /mcp [id] */
function renderMcp(rawInput) {
  const wanted = rawInput.trim();
  if (!existsSync(PATCH_FILE)) {
    return { kind: "error", text: `找不到配置文件: ${PATCH_FILE}` };
  }
  let text = "";
  try {
    text = readFileSync(PATCH_FILE, "utf8");
  } catch (e) {
    return { kind: "error", text: "读取配置失败: " + String(e && e.message || e) };
  }
  const entries = parseMcpEntries(text);
  if (wanted) {
    const hit = entries.find((e) => e.id === wanted || e.serverName === wanted);
    if (!hit) return { kind: "error", text: `未找到 MCP 服务: ${wanted}` };
    return {
      kind: "success",
      text: [
        `MCP ${hit.id}`,
        hit.serverName ? `名称: ${hit.serverName}` : "",
        hit.transport ? `传输: ${hit.transport}` : "",
        hit.command ? `命令: ${hit.command}` : "",
        hit.url ? `地址: ${hit.url}` : "",
        `状态: ${hit.disabled ? "⛔ 已禁用" : "✅ 启用"}`
      ].filter(Boolean).join("\n")
    };
  }
  if (entries.length === 0) {
    return {
      kind: "success",
      text: "未配置 MCP 服务。可在「设置 → 插件管理」中添加/管理 MCP。"
    };
  }
  const lines = entries.map((e) => {
    const badge = e.disabled ? "⛔已禁用" : "✅启用";
    const name = e.serverName || e.id;
    const transport = e.transport ? ` (${e.transport})` : "";
    return `• ${name}${transport} — ${badge}`;
  });
  return {
    kind: "success",
    text: [
      `已配置的 MCP 服务(${entries.length}):`,
      ...lines,
      `配置文件: ${PATCH_FILE}`,
      `用法: /mcp <id> 查看详情;开关/删除在「设置 → 插件管理」`
    ].join("\n")
  };
}

/** /plugins [名称] */
function renderPlugins(rawInput) {
  const wanted = rawInput.trim();
  const userPlugins = listUserPlugins();
  if (wanted) {
    const hit = userPlugins.find((p) => p.name === wanted || p.name.endsWith("/" + wanted));
    if (!hit) return { kind: "error", text: `未找到插件: ${wanted}` };
    return {
      kind: "success",
      text: [
        `插件 ${hit.name}@${hit.version}`,
        hit.description ? clip(hit.description, 120) : "(无描述)",
        `路径: ${hit.path}`
      ].join("\n")
    };
  }
  if (userPlugins.length === 0) {
    return {
      kind: "success",
      text: `~/.dsh/plugins 下暂无用户插件。内置 @deepseek-ai 包共 ${listBuiltinCount()} 个(只读,见「设置 → 插件管理」)。`
    };
  }
  const lines = userPlugins.map((p) => {
    const head = p.name + (p.version ? "@" + p.version : "");
    return `• ${head}${p.description ? " — " + clip(p.description, 60) : ""}`;
  });
  return {
    kind: "success",
    text: [
      `已安装用户插件(${userPlugins.length}):`,
      ...lines,
      `内置 @deepseek-ai 包 ${listBuiltinCount()} 个(只读)。`,
      `用法: /plugins <名称> 查看详情`
    ].join("\n")
  };
}

/** /skills [名称] */
function renderSkills(rawInput) {
  const wanted = rawInput.trim();
  const skills = listSkills();
  if (wanted) {
    const hit = skills.find((s) => s.name === wanted);
    if (!hit) return { kind: "error", text: `未找到 skill: ${wanted}` };
    let body = "";
    try {
      body = stripFrontmatter(readFileSync(join(hit.path, "SKILL.md"), "utf8"));
    } catch {}
    const capped = body.length > 2500 ? body.slice(0, 2500) + "\n…(内容过长,已截断)" : body;
    return {
      kind: "success",
      text: [
        `Skill ${hit.name}`,
        hit.description ? `描述: ${hit.description}` : "",
        `路径: ${hit.path}`,
        `---`,
        capped
      ].filter(Boolean).join("\n")
    };
  }
  if (skills.length === 0) return { kind: "success", text: "~/.dsh/skills 下暂无已安装 skill。" };
  const lines = skills.map((s) => `• ${s.name}${s.description ? " — " + clip(s.description, 48) : ""}`);
  return {
    kind: "success",
    text: [
      `已安装 skills(${skills.length}):`,
      ...lines,
      `💡 快捷用法:点输入框「+」→「技能」分组,直接点击某个 skill 即可把它加入对话框,发送即调用`,
      `用法: /skills <名称> 查看完整说明`
    ].join("\n")
  };
}

/**
 * 注册三个命令。注册方式与官方 dsh-command-compact 相同:
 * ctx.effect(generator) 管理生命周期,register 返回 disposer 由 effect 消费。
 * input.hint 让命令在菜单里点击后「插入可编辑文本」而非立即执行。
 */
export function apply(ctx) {
  ctx.effect(function* () {
    yield ctx.commands.register({
      name: "mcp",
      description: "列出已配置的 MCP 服务(回车查看,或输入 id 看详情)",
      input: { hint: "MCP 服务 id(可选,直接回车列出全部)" },
      handler: (invocation) => renderMcp(invocation.rawInput)
    });
    yield ctx.commands.register({
      name: "plugins",
      description: "列出已安装的插件(回车查看,或输入名称看详情)",
      input: { hint: "插件名称(可选,直接回车列出全部)" },
      handler: (invocation) => renderPlugins(invocation.rawInput)
    });
    yield ctx.commands.register({
      name: "skills",
      description: "列出已安装的 skill(回车查看,或输入名称看完整说明)",
      input: { hint: "skill 名称(可选,直接回车列出全部)" },
      handler: (invocation) => renderSkills(invocation.rawInput)
    });
  }, "dsh-command-menu lifecycle");
}
