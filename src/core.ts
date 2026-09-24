import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { atomic, dateCheck, ensureFile, exists, fail, gitInit, gitRoot, globalGitUser, hash, inside, jsonWrite, localConfigPath, nameCheck, readJson, records, RecordSchema, RootSchema, run, same, slash, validateRoot, withLock, type WorkRecord } from './common.js';
import { addAgents, createTask, initTrellis, taskFolders, trellisPreflight, validateAgents } from './trellis.js';

const layout = ['trellis','knowledge/work','knowledge/archive','knowledge/operations','code','navigation/registry/works','navigation/indexes/工作目录','navigation/templates','navigation/workspaces','.wk/runs'];
export type InitInput = {name:string; slug:string; date:string; components:string[]; trellisExisting?:string; codeExisting?:string; workspaceName?:string};
export type Plan = { root:string; record:WorkRecord; existing:boolean; directories:string[]; modifications:string[] };
const JournalSchema = z.object({schemaVersion:z.literal(1), id:z.string(), requestHash:z.string(), record:RecordSchema, status:z.enum(['running','failed','complete']), done:z.array(z.string()), error:z.string().optional()});
function noAncestorGit(p: string) {
  let base = p; while (!exists(base)) base = path.dirname(base);
  const g = gitRoot(base); if (g && !same(g,p)) fail(`目标位于已有 Git 仓库 ${g} 内，拒绝嵌套：${p}`,3);
}
export function installPlan(root: string) {
  if (path.dirname(root) === root) fail('不能把磁盘根目录作为 WorkHub。',2);
  noAncestorGit(root);
  if (gitRoot(root)) fail('WorkHub 根目录不能自身是 Git 仓库。',3);
  const config = inside(root,'.wk/config.json');
  if (exists(config)) RootSchema.parse(readJson(config));
  else if (exists(root) && fs.readdirSync(root).some(n=>n !== '.wk' && !layout.includes(n))) fail('目标是未登记的非空目录，请使用空目录或已配置的 WorkHub。',3);
  for (const rel of layout) {
    const p = inside(root,rel);
    if (exists(p) && !fs.statSync(p).isDirectory()) fail(`目录位置被文件占用：${p}`,3);
  }
  noAncestorGit(inside(root,'navigation'));
  return {root, directories:layout, localConfig:localConfigPath(), git:'navigation', note:'仅创建公共结构；不提交、不创建远程。'};
}
export function install(root:string, gitUser?: string) {
  installPlan(root);
  const resolvedGitUser = gitUser?.trim() || globalGitUser();
  if (!resolvedGitUser) fail('未找到全局 Git 用户名，请在 workhub install 中填写 Git 用户名。', 2);
  fs.mkdirSync(root,{recursive:true});
  return withLock(root,()=>{
    installPlan(root);
    for (const rel of layout) fs.mkdirSync(inside(root,rel),{recursive:true});
    gitInit(inside(root,'navigation'));
    ensureFile(inside(root,'navigation/README.md'),'# WorkHub 导航\n\nregistry/works 是工作登记来源；indexes/工作目录由 workhub 自动生成。\nworkspaces 内工作区由用户在 VS Code 中创建。\n手写说明请另建文件，避免编辑自动生成的年度索引。\n');
    ensureFile(inside(root,'navigation/indexes/系统目录.md'),'# 系统目录\n\n长期系统知识按需建立，当前尚未登记系统。本文可人工维护；年度工作索引由 workhub 生成。\n');
    ensureFile(inside(root,'navigation/templates/README.md'),'# 模板说明\n\nworkhub 内置模板随 npm 包分发；本目录预留人工模板。0.1 不自动加载或覆盖自定义模板。\n');
    jsonWrite(inside(root,'.wk/config.json'),{schemaVersion:1,layoutVersion:1,templateVersion:1,gitUser:resolvedGitUser});
    jsonWrite(localConfigPath(),{schemaVersion:1,root});
    return {root,status:'configured',gitUser:resolvedGitUser,next:'workhub init'};
  });
}
function component(root:string, category:string, slug:string, existing?:string) {
  const rel = existing ? slash(path.normalize(existing)) : `${category}/${slug}`;
  inside(inside(root,category),path.relative(inside(root,category),inside(root,rel)));
  const p = inside(root,rel);
  if (existing) {
    if (!exists(p) || !fs.statSync(p).isDirectory()) fail(`关联目录不存在：${p}`,3);
    const g = gitRoot(p); if (!g || !same(g,p)) fail(`关联目录必须是独立 Git 仓库根：${p}`,3);
    if (category === 'trellis' && !exists(inside(root,`${rel}/.trellis/scripts/task.py`))) fail('关联目录不是支持的 Trellis 管理空间。',3);
  }
  return {path:rel,mode: existing ? 'linked' as const : 'created' as const};
}
function journalFile(root:string,id:string) { return inside(root,`.wk/runs/${id}.json`); }
export function makePlan(root:string, input:InitInput): Plan {
  validateRoot(root); nameCheck(input.name); nameCheck(input.slug); dateCheck(input.date);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) fail('英文代号只允许小写字母、数字和单连字符。',2);
  const selected = [...new Set(['trellis', ...input.components])].sort();
  if (selected.some(c=>!['work','trellis','code'].includes(c))) fail('有效组件为 work、code；Trellis 始终必选。',2);
  if ((input.trellisExisting && !selected.includes('trellis')) || (input.codeExisting && !selected.includes('code'))) fail('关联已有目录需要选择对应组件。',2);
  const id = `${input.date.replaceAll('-','')}-${input.slug}`;
  const filename = nameCheck(input.workspaceName ?? `${input.name}.code-workspace`);
  if (!filename.endsWith('.code-workspace')) fail('工作区文件名必须以 .code-workspace 结尾。',2);
  const record:WorkRecord = {schemaVersion:1,id,name:input.name,slug:input.slug,createdDate:input.date,lifecycle:'active',components:{code:[]},operations:[],workspace:{expectedPath:`navigation/workspaces/${filename}`},requestHash:''};
  if (selected.includes('work')) record.components.work = {path:`knowledge/work/${input.date.slice(0,4)}/${input.date.replaceAll('-','')}-${input.name}`,mode:'created'};
  if (selected.includes('code')) record.components.code = [component(root,'code',input.slug,input.codeExisting)];
  if (selected.includes('trellis')) record.components.trellis = component(root,'trellis',input.slug,input.trellisExisting);
  record.requestHash = hash(JSON.stringify(record));
  const all = records(root);
  const previous = all.find(r=>r.id===id);
  if (previous) {
    if (!previous.components.trellis) fail(`旧工作缺少必需的 Trellis 入口：${id}。请先迁移或补齐正式管理空间与任务登记；workhub 不自动改写旧工作。`,3);
    if (previous.requestHash !== record.requestHash) fail(`工作编号已存在，参数不一致：${id}`,3);
    return {root,record:previous,existing:true,directories:[],modifications:[]};
  }
  const logFile = journalFile(root,id);
  const log = exists(logFile) ? JournalSchema.parse(readJson(logFile)) : undefined;
  if (log && log.requestHash !== record.requestHash) fail(`存在参数不同的未完成操作：${logFile}`,3);
  const sameWorkspace = all.some(r=>r.workspace.expectedPath.toLowerCase() === record.workspace.expectedPath.toLowerCase());
  if (sameWorkspace || exists(inside(root,record.workspace.expectedPath))) fail('工作区预期文件名被占用，请用 --workspace-name 指定其他名称。',3);
  const comps = [record.components.work,record.components.trellis,...record.components.code].filter(c=>c!==undefined);
  const modifications:string[] = [];
  for (const c of comps) {
    const p = inside(root,c.path);
    if (c.mode==='created') {
      if (exists(p) && !log?.done.includes(`owned:${c.path}`)) fail(`目标已存在，请明确关联或换代号：${p}`,3);
      noAncestorGit(p);
    }
  }
  if (record.components.trellis) {
    const tr = record.components.trellis.path;
    const agents = inside(root,`${tr}/AGENTS.md`); validateAgents(agents);
    if (exists(agents) && !fs.readFileSync(agents,'utf8').includes('<!-- WK:START')) modifications.push(`${tr}/AGENTS.md：保留原文，追加 WK 工作边界区块`);
    if (!log && taskFolders(root,tr,id).length) fail('Trellis 已有同编号任务，需先人工核对登记关系。',3);
    modifications.push(`${tr}/.trellis/tasks：创建正式任务及目录映射，不切换当前任务`);
  }
  // Validate every destination before creating anything.
  for (const rel of [record.workspace.expectedPath,`navigation/registry/works/${id}.json`,`.wk/runs/${id}.json`,`navigation/indexes/工作目录/${input.date.slice(0,4)}.md`]) inside(root,rel);
  return {root,record,existing:false,directories:comps.filter(c=>c.mode==='created').map(c=>c.path),modifications};
}
const esc = (s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('|','&#124;').replace(/[\r\n]/g,' ');
export function indexText(all:WorkRecord[],year:string) {
  return `<!-- WK GENERATED: edit registry/works, not this file -->\n# ${year} 年工作目录\n\n| 工作编号 | 名称 | 日期 | 生命周期 | 资料位置 | 工作区预期路径 |\n|---|---|---|---|---|---|\n` + all.filter(r=>r.createdDate.startsWith(year)).sort((a,b)=>a.id.localeCompare(b.id)).map(r=>`| ${r.id} | ${esc(r.name)} | ${r.createdDate} | ${r.lifecycle} | ${esc(r.components.work?.path ?? '未启用 work')} | ${esc(r.workspace.expectedPath)} |`).join('\n')+'\n';
}
export function writeIndexes(root:string) {
  const all = records(root);
  for (const year of new Set(all.map(r=>r.createdDate.slice(0,4)))) atomic(inside(root,`navigation/indexes/工作目录/${year}.md`),indexText(all,year));
}
export function init(root:string,input:InitInput) {
  const initial = makePlan(root,input);
  // Preflight dependencies before any project writes, including when called from AI.
  run('git',['--version']);
  const tools = initial.record.components.trellis && !initial.existing ? trellisPreflight() : undefined;
  return withLock(root,()=>{
    const plan = makePlan(root,input);
    if (plan.existing) {
      const logFile=journalFile(root,plan.record.id);
      if(exists(logFile)) {
        const old=JournalSchema.parse(readJson(logFile));
        if(old.status!=='complete') {
          // A registry write may succeed immediately before index publication fails.
          // Repair only this known incomplete transaction, not arbitrary edited indexes.
          writeIndexes(root); old.status='complete'; delete old.error; jsonWrite(logFile,old);
        }
      }
      return {status:'existing',record:plan.record,check:check(root,plan.record.id)};
    }
    const rec = plan.record;
    const rootConfig = z.object({gitUser:z.string().min(1)}).parse(readJson(inside(root,'.wk/config.json')));
    const f = journalFile(root,rec.id);
    const log = exists(f) ? JournalSchema.parse(readJson(f)) : {schemaVersion:1 as const,id:rec.id,requestHash:rec.requestHash,record:rec,status:'running' as 'running'|'failed'|'complete',done:[] as string[],error:undefined as string|undefined};
    log.status='running'; delete log.error; jsonWrite(f,log);
    const step = (key:string, fn:()=>void) => { if (!log.done.includes(key)) { fn(); log.done.push(key); jsonWrite(f,log); } };
    try {
      for (const c of [rec.components.work,rec.components.trellis,...rec.components.code].filter(c=>c!==undefined)) {
        const p=inside(root,c.path);
        if (c.mode==='created') {
          // Record ownership intent before mkdir; a crash leaves a resumable known destination.
          step(`owned:${c.path}`,()=>{});
          fs.mkdirSync(p,{recursive:true});
          if (rec.components.trellis?.path===c.path) step(`trellis:${c.path}`,()=>initTrellis(p,tools!,rootConfig.gitUser));
          step(`git:${c.path}`,()=>gitInit(p));
        }
      }
      if (rec.components.work) {
        const rel=rec.components.work.path;
        for (const child of ['原始材料','调查分析','实施记录','验证证据','结果与交付']) fs.mkdirSync(inside(root,`${rel}/${child}`),{recursive:true});
        ensureFile(inside(root,`${rel}/README.md`),`# ${rec.name}\n\n工作编号：${rec.id}\n创建日期：${rec.createdDate}\n状态：进行中，业务尚未验证\n\n## 目标、范围与完成条件\n待用户与 AI 确认。\n\n## 关联目录\n以下路径相对于 WorkHub 根目录：\n- Trellis：${rec.components.trellis?.path ?? '未启用'}\n- 代码：${rec.components.code.map(c=>c.path).join(', ') || '未启用'}\n- 登记：navigation/registry/works/${rec.id}.json\n\n## 证据与交付\n原始材料、调查分析、实施记录、验证证据、结果与交付分别存放。所有程序和脚本写入 code。\n\n## 未确认事项\n尚无业务验证结论。\n`);
        ensureFile(inside(root,`${rel}/.gitignore`),'*.tmp\n~$*\n.env\n');
      }
      for (const c of rec.components.code.filter(c=>c.mode==='created')) {
        ensureFile(inside(root,`${c.path}/README.md`),`# ${rec.name}\n\nWorkHub 工作：${rec.id}\n\n## 构建、运行与测试\n待实现后补充。业务资料见登记中的 work 路径。\n`);
        ensureFile(inside(root,`${c.path}/.gitignore`),'node_modules/\ndist/\n.venv/\n__pycache__/\n.env\n');
      }
      if (rec.components.trellis) {
        addAgents(inside(root,`${rec.components.trellis.path}/AGENTS.md`));
        rec.taskPath=createTask(root,rec,tools!.python);
      }
      jsonWrite(inside(root,`navigation/registry/works/${rec.id}.json`),rec);
      writeIndexes(root);
      log.status='complete'; log.record=rec; jsonWrite(f,log);
      return {status:'created',record:rec,workspace:'仅预留，需手动创建',primary:rec.components.trellis?.path ?? '未启用 Trellis',check:check(root,rec.id)};
    } catch(e) { log.status='failed';log.error=e instanceof Error?e.message:String(e); jsonWrite(f,log); throw e; }
  });
}
export function show(root:string,id:string) {
  validateRoot(root); const rec=records(root).find(r=>r.id===id); if (!rec) return fail(`没有该工作：${id}`,2);
  return {record:rec,root,workspace:exists(inside(root,rec.workspace.expectedPath))?'已存在':'待创建',primary:rec.components.trellis?inside(root,rec.components.trellis.path):null};
}
export function check(root:string,id?:string) {
  validateRoot(root); const all=records(root); const selected=id?all.filter(r=>r.id===id):all;
  if (id && !selected.length) fail(`没有该工作：${id}`,2);
  const errors:string[]=[]; const warnings:string[]=[];
  for (const rec of selected) {
    if (!rec.components.trellis) errors.push(`旧工作缺少必需的 Trellis 主目录：${rec.id}；需要迁移，未自动修改。`);
    for (const c of [rec.components.work,rec.components.trellis,...rec.components.code].filter(c=>c!==undefined)) {
      const p=inside(root,c.path);
      if (!exists(p)) { errors.push(`缺少目录：${c.path}`); continue; }
      const g=gitRoot(p); if (!g || !same(g,p)) errors.push(`不是独立 Git 仓库：${c.path}`);
    }
    if (rec.components.work && !exists(inside(root,`${rec.components.work.path}/README.md`))) errors.push(`缺少业务 README：${rec.id}`);
    if (rec.components.trellis) {
      const p=inside(root,`${rec.components.trellis.path}/AGENTS.md`);
      if (!exists(p) || !fs.readFileSync(p,'utf8').includes('<!-- WK:START')) errors.push(`缺少 WK 入口：${rec.id}`);
      if (!rec.taskPath) errors.push(`缺少任务入口：${rec.id}`);
      else for (const name of ['task.json','wk-context.md','wk-handoff.md']) if (!exists(inside(root,`${rec.taskPath}/${name}`))) errors.push(`缺少任务文件：${rec.taskPath}/${name}`);
    }
    if (!exists(inside(root,rec.workspace.expectedPath))) warnings.push(`工作区待创建：${rec.workspace.expectedPath}`);
  }
  for (const year of new Set(selected.map(r=>r.createdDate.slice(0,4)))) {
    const p=inside(root,`navigation/indexes/工作目录/${year}.md`);
    if (!exists(p) || fs.readFileSync(p,'utf8')!==indexText(all,year)) errors.push(`年度索引不一致：${year}`);
  }
  const runs=inside(root,'.wk/runs');
  if (exists(runs)) for(const n of fs.readdirSync(runs).filter(n=>n.endsWith('.json'))) {
    const j=JournalSchema.parse(readJson(inside(root,`.wk/runs/${n}`)));
    if ((!id || j.id===id) && j.status!=='complete') warnings.push(`未完成操作：${j.id}；状态 ${j.status}，使用相同参数重试并检查日志。`);
  }
  return {ok:errors.length===0,errors,warnings,works:selected.length};
}
