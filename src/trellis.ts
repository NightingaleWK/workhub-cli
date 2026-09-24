import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists, fail, inside, readJson, run, ensureFile, slash, type WorkRecord } from './common.js';
import { npmGlobalTrellis } from './dependencies.js';

// Resolve the official npm launcher without invoking cmd.exe or interpolating a shell command.
export function findTrellisCommand(): { command: string; prefix: string[] } | undefined {
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    const candidate = path.join(dir, 'node_modules', '@mindfoldhq', 'trellis', 'bin', 'trellis.js');
    if (exists(candidate)) return { command: process.execPath, prefix: [candidate] };
    if (process.platform !== 'win32' && exists(path.join(dir, 'trellis'))) return { command: path.join(dir, 'trellis'), prefix: [] };
  }
  const globalEntry=npmGlobalTrellis();
  return globalEntry?{command:process.execPath,prefix:[globalEntry]}:undefined;
}
export function trellisCommand(): { command: string; prefix: string[] } {
  return findTrellisCommand() ?? fail('未找到 Trellis。请运行 workhub install 并同意安装，或执行 npm install -g @mindfoldhq/trellis@latest。');
}
export function verifyTrellis() {
  const t=trellisCommand();
  return run(t.command,[...t.prefix,'--version']);
}
export function trellisPreflight() {
  const t = trellisCommand();
  const version = run(t.command, [...t.prefix, '--version']);
  const help = run(t.command, [...t.prefix, 'init', '--help']);
  for (const option of ['--codex', '--no-monorepo', '--user']) if (!help.includes(option)) fail(`当前 Trellis 初始化接口不兼容：缺少 ${option}`);
  const python = process.env.WORKHUB_PYTHON ?? 'python';
  run(python, ['--version']);
  return { ...t, version, python };
}
export function agentsTemplate() { return fs.readFileSync(fileURLToPath(new URL('../templates/agents.md', import.meta.url)), 'utf8'); }
export function validateAgents(p: string) {
  if (!exists(p)) return;
  const text = fs.readFileSync(p, 'utf8');
  if (text.includes('<!-- WORKHUB:')) {
    const block = text.match(/<!-- WORKHUB:START v1 -->[\s\S]*?<!-- WORKHUB:END -->/g);
    if (block?.length !== 1 || block[0]!.trim() !== agentsTemplate().trim()) fail(`WORKHUB 指令区块存在人工修改或版本冲突，请先审阅：${p}`, 3);
  }
}
export function addAgents(p: string) {
  validateAgents(p);
  const text = exists(p) ? fs.readFileSync(p, 'utf8') : '';
  if (!text.includes('<!-- WORKHUB:START')) {
    // Preserve Trellis and user-owned text exactly, append only our own block.
    fs.writeFileSync(p, text + (text && !text.endsWith('\n') ? '\n' : '') + '\n' + agentsTemplate());
  }
}
export function initTrellis(dir: string, tools: ReturnType<typeof trellisPreflight>, gitUser: string) {
  run(tools.command, [...tools.prefix, 'init', '--codex', '--yes', '--user', gitUser, '--no-monorepo'], dir);
  if (!exists(path.join(dir,'.trellis','scripts','task.py'))) fail(`Trellis 初始化未生成任务脚本：${dir}`);
}
export function taskFolders(root: string, tr: string, id: string) {
  const tasks = inside(root, `${tr}/.trellis/tasks`);
  if (!exists(tasks)) return [];
  return fs.readdirSync(tasks, {withFileTypes:true}).filter(d=>d.isDirectory()).flatMap(d=>{
    const rel = `${tr}/.trellis/tasks/${d.name}`;
    const f = inside(root, `${rel}/task.json`);
    if (!exists(f)) return [];
    const obj = readJson(f) as {id?:string};
    return obj.id === id ? [rel] : [];
  });
}
export function createTask(root: string, record: WorkRecord, python: string): string {
  const tr = record.components.trellis!.path;
  const dir = inside(root, tr);
  let found = taskFolders(root,tr,record.id);
  if (!found.length) {
    run(python, ['.trellis/scripts/task.py','create',record.name,'--slug',record.id,'--description',`WorkHub 工作 ${record.id}；业务范围与验收条件见关联 work README。`,'--no-start'], dir);
    found = taskFolders(root,tr,record.id);
  }
  if (found.length !== 1) fail(`无法唯一定位 Trellis 任务：${record.id}`);
  const rel = found[0]!;
  const taskDir = inside(root,rel);
  const rows = [record.components.work, ...record.components.code, record.components.trellis].filter(Boolean).map(c=>`- ${c!.path}`).join('\n');
  ensureFile(inside(root,`${rel}/workhub-context.md`), `# ${record.name}\n\n工作编号：${record.id}\n工作日期：${record.createdDate}\n\nWorkHub 根目录（相对于本文件所在目录）：\`${slash(path.relative(taskDir,root))}\`\n\n以下路径相对于 WorkHub 根目录：\n${rows}\n\n登记：navigation/registry/works/${record.id}.json\n工作区预期路径：${record.workspace.expectedPath}\n\n先读取业务 README 和本任务 workhub-handoff.md。所有代码写入 code，业务证据写入 work。未启用对应目录时先说明缺口。\n`);
  ensureFile(inside(root,`${rel}/workhub-handoff.md`), `# 工作交接\n\n工作编号：${record.id}\n\n## 已完成\n- 工作目录与管理入口初始化。\n\n## 未验证\n- 业务需求、实现和验收尚未开始。\n\n## 下一步\n- 与用户明确目标、范围和完成条件，更新业务 README。\n\n## 证据和版本\n- 尚无业务验证结果；Git 未自动提交。\n`);
  return rel;
}
