import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { z } from 'zod';

export class WorkHubError extends Error { constructor(message: string, public code = 1) { super(message); } }
export const fail = (message: string, code = 1): never => { throw new WorkHubError(message, code); };
export const exists = (p: string) => fs.existsSync(p);
export const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const slash = (p: string) => p.split(path.sep).join('/');
export function readJson(p: string): unknown {
  try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); }
  catch { return fail(`无法读取有效 JSON：${p}`); }
}
export function atomic(p: string, text: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmp, text, { flag: 'wx' });
  try { fs.renameSync(tmp, p); } finally { if (exists(tmp)) fs.unlinkSync(tmp); }
}
export const jsonWrite = (p: string, data: unknown) => atomic(p, JSON.stringify(data, null, 2) + '\n');
export function ensureFile(p: string, value: string) {
  if (!exists(p)) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, value, { flag: 'wx' }); }
  else if (!fs.statSync(p).isFile()) fail(`应为文件：${p}`, 3);
}
export function real(p: string): string {
  // Windows 8.3 aliases (RUNNER~1) must compare equal to Git's long paths.
  if (exists(p)) return fs.realpathSync.native(p);
  const parent = path.dirname(p);
  if (parent === p) return p;
  return path.join(real(parent), path.basename(p));
}
export function inside(root: string, rel: string): string {
  if (!rel || path.isAbsolute(rel) || /^[A-Za-z]:/.test(rel)) fail(`需要根目录内相对路径：${rel}`, 2);
  const target = path.resolve(root, rel);
  for (const [base, child] of [[path.resolve(root), target], [real(root), real(target)]]) {
    const r = path.relative(base!, child!);
    if (!r || r === '..' || r.startsWith(`..${path.sep}`) || path.isAbsolute(r)) fail(`路径越界或指向根目录：${rel}`, 3);
  }
  return target;
}
export function nameCheck(name: string) {
  if (!name.trim() || name.length > 100 || /[<>:"/\\|?*\x00-\x1f]/.test(name) || /[. ]$/.test(name) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name) || name === '.' || name === '..') fail(`无效 Windows 文件名：${name}`, 2);
  return name;
}
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function dateCheck(s: string) {
  const d = new Date(`${s}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== s) fail(`无效日期：${s}`, 2);
  return s;
}
export function run(command: string, args: string[], cwd?: string): string {
  const r = spawnSync(command, args, { cwd, encoding: 'utf8', windowsHide: true, timeout: 120000, env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } });
  if (r.error || r.status !== 0) fail(`${command} 执行失败：${r.error?.message ?? r.stderr ?? r.stdout}`);
  return r.stdout.trim();
}
export function globalGitUser(): string | undefined {
  const r = spawnSync('git', ['config', '--global', '--get', 'user.name'], { encoding: 'utf8', windowsHide: true });
  const value = r.status === 0 ? r.stdout.trim() : '';
  return value || undefined;
}
export function gitRoot(p: string): string | undefined {
  const r = spawnSync('git', ['-C', p, 'rev-parse', '--show-toplevel'], { encoding:'utf8', windowsHide: true });
  return r.status === 0 ? r.stdout.trim() : undefined;
}
export function same(a: string, b: string) { const x = real(a); const y = real(b); return process.platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y; }
export function gitInit(p: string) {
  const g = gitRoot(p);
  if (g && !same(g, p)) fail(`拒绝嵌套仓库：${p} 位于 ${g}`, 3);
  if (!g) run('git', ['init', '--initial-branch=main', p]);
}
export function localConfigPath() { return process.env.WORKHUB_CONFIG_PATH ?? path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), '.config'), 'workhub-cli', 'config.json'); }
export function rootResolve(input?: string): string {
  if (input) return path.resolve(input);
  const file = localConfigPath();
  if (!exists(file)) return fail('尚未配置根目录，请先运行 workhub install 或指定 --root。', 2);
  const config = z.object({ schemaVersion: z.literal(1), root: z.string() }).parse(readJson(file));
  return path.resolve(config.root);
}
export const RootSchema = z.object({ schemaVersion: z.literal(1), layoutVersion: z.literal(1), templateVersion: z.literal(1), gitUser: z.string().min(1).optional() });
const Component = z.object({ path: z.string(), mode: z.enum(['created', 'linked']) });
export const RecordSchema = z.object({
  schemaVersion: z.literal(1), id: z.string().regex(/^\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string(), slug: z.string(), createdDate: z.string(), lifecycle: z.enum(['active','archived']),
  components: z.object({ work: Component.optional(), trellis: Component.optional(), code: z.array(Component) }),
  operations: z.array(z.string()), workspace: z.object({ expectedPath: z.string() }), taskPath: z.string().optional(),
  requestHash: z.string(),
});
export type WorkRecord = z.infer<typeof RecordSchema>;
export function validateRoot(root: string) { RootSchema.parse(readJson(inside(root, '.workhub/config.json'))); }
export function records(root: string): WorkRecord[] {
  const dir = inside(root, 'navigation/registry/works');
  if (!exists(dir)) fail(`缺少登记目录：${dir}`);
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n => {
    const rec = RecordSchema.parse(readJson(inside(root, `navigation/registry/works/${n}`)));
    if (n !== `${rec.id}.json`) fail(`登记文件名与编号不一致：${n}`);
    return rec;
  });
}
export function withLock<T>(root: string, action: () => T): T {
  const dir = inside(root, '.workhub'); fs.mkdirSync(dir, {recursive:true});
  const lock = inside(root, '.workhub/write.lock');
  let fd: number;
  try { fd = fs.openSync(lock, 'wx'); } catch { return fail(`存在写锁：${lock}。确认没有 workhub 进程后，手动检查并移走残留锁；不自动删除。`, 3); }
  fs.writeFileSync(fd, JSON.stringify({pid:process.pid, host:os.hostname(), startedAt:new Date().toISOString()}));
  try { return action(); } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
