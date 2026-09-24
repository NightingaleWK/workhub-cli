#!/usr/bin/env node
import path from 'node:path';
import os from 'node:os';
import { Command, CommanderError } from 'commander';
import * as p from '@clack/prompts';
import { ZodError } from 'zod';
import { previewLines, renderPreview } from './preview.js';
import { check, init, install, installPlan, makePlan, show, type InitInput } from './core.js';
import { exists, fail, globalGitUser, nameCheck, dateCheck, records, rootResolve, today, validateRoot, WkError } from './common.js';

const program=new Command().name('wk').description('WorkHub 工作初始化与登记工具').version('0.1.1').exitOverride();
let jsonMode=process.argv.includes('--json');
const interactive=(o:Opts)=>!o.yes && !o.json && !!process.stdin.isTTY && !!process.stdout.isTTY;
type Opts={root?:string;yes?:boolean;json?:boolean;dryRun?:boolean;name?:string;slug?:string;date?:string;components?:string;trellisExisting?:string;codeExisting?:string;workspaceName?:string};
function output(value:unknown) {
  if(jsonMode || !process.stdout.isTTY) {console.log(JSON.stringify(value,null,2));return;}
  const v=value as any;
  if(Array.isArray(v)) {
    if(!v.length)console.log('尚未登记工作，请运行 wk init。');
    for(const r of v)console.log(`${r.id}  ${r.name}  [${r.lifecycle}]`);
    return;
  }
  if(v.status==='configured') {console.log(`✓ WorkHub 已配置：${v.root}\nGit 用户名：${v.gitUser}\n下一步：wk init`);return;}
  if(v.record) {
    console.log(`\n✓ ${v.status==='existing'?'工作已存在':v.status==='created'?'工作初始化完成':'工作详情'}：${v.record.name}`);
    console.log(`编号：${v.record.id}`);
    for(const [label,comp] of [['业务',v.record.components.work],['Trellis',v.record.components.trellis],...v.record.components.code.map((c:any)=>['代码',c])])if(comp)console.log(`${label}：${comp.path}`);
    console.log(`工作区预期位置：${v.record.workspace.expectedPath}\n工作区：${v.workspace??'请在 VS Code 中手动创建'}\n主目录：${v.primary??'未启用 Trellis'}`);
    if(v.record.taskPath)console.log(`任务入口：${v.record.taskPath}/wk-context.md`);
    console.log('未自动提交、推送或创建应用项目。');
    if(v.check && !v.check.ok)for(const e of v.check.errors)console.error(`错误：${e}`);
    return;
  }
  if(typeof v.ok==='boolean') {
    console.log(v.ok?'✓ 检查通过':'检查未通过');
    for(const e of v.errors??[])console.error(`错误：${e}`);
    for(const w of v.warnings??[])console.log(`提示：${w}`);
    return;
  }
  console.log(JSON.stringify(value,null,2));
}
function answer<T>(v:T):Exclude<T,symbol> { if(p.isCancel(v)) fail('已取消，未继续执行。',130); return v as Exclude<T,symbol>; }
function validation(fn:(v:string)=>unknown) { return (s:string|undefined)=>{try{fn(s??'');return undefined;}catch(e){return (e as Error).message;}}; }
function options(cmd:Command,write=false) {
  cmd.option('--root <path>','指定 WorkHub 根目录').option('--json','机器可读 JSON 输出');
  if(write)cmd.option('-y, --yes','接受计划，不进行交互；仍执行冲突检查').option('--dry-run','仅检查并输出计划，不写入');
  return cmd;
}
async function approve(o:Opts,plan:unknown) {
  if(o.dryRun) return 'preview' as const;
  if(interactive(o)) {
    console.log(renderPreview(previewLines(plan as Parameters<typeof previewLines>[0])));
    return answer(await p.confirm({message:'确认配置？（Esc 取消）',active:'确认',inactive:'返回修改'}))?'execute' as const:'edit' as const;
  }
  else if(!o.yes) fail('非交互写入需要 --yes；或使用 --dry-run 查看计划。',2);
  return 'execute' as const;
}
options(program.command('install').description('配置根目录并建立公共结构'),true).action(async(o:Opts)=>{
  let root=o.root;
  let gitUser=globalGitUser();
  while(true) {
  if(interactive(o)) { p.intro('配置 WorkHub'); let defaultRoot=path.join(os.homedir(),'WorkHub'); try{defaultRoot=rootResolve();}catch{} root=answer(await p.text({message:'工作根目录（回车使用默认值）',placeholder:root??defaultRoot,defaultValue:root??defaultRoot})); }
  if(!root) root=path.join(os.homedir(),'WorkHub');
  root=path.resolve(root);const plan=installPlan(root);
  if(interactive(o)) gitUser=answer(await p.text({message:'Git 全局用户名（用于 trellis init -u）',placeholder:gitUser??'例如 NightingaleWK',defaultValue:gitUser,validate:s=>(s?.trim()||gitUser)?undefined:'必须填写 Git 用户名'}));
  else if(!gitUser) fail('未找到全局 Git 用户名，请在 wk install 中填写或先设置 git config --global user.name。',2);
  const executionPlan={...plan,gitUser};
  const decision=await approve(o,executionPlan);
  if(decision==='edit')continue;
  if(decision==='preview'){output(executionPlan);return;}
  output(install(root,gitUser));return;
  }
});
options(program.command('init').description('交互创建工作，或使用参数供 AI 调用'),true)
  .option('--name <name>','中文工作名').option('--slug <slug>','英文代号').option('--date <YYYY-MM-DD>','工作日期，默认本地今天')
  .option('--components <items>','可选 work,code；none 表示仅 Trellis；省略默认 work；Trellis 始终包含').option('--trellis-existing <path>','根目录内已有 Trellis 仓库相对路径')
  .option('--code-existing <path>','根目录内已有代码仓库相对路径').option('--workspace-name <filename>','替代工作区文件名')
  .action(async(o:Opts)=>{
    const root=rootResolve(o.root);validateRoot(root);
    let name=o.name,slug=o.slug,date=o.date??today(),components=o.components===undefined?undefined:o.components==='none'?[]:o.components.split(',').map(s=>s.trim());
    let editing=false;
    while(true) {
    if(interactive(o)) {
      p.intro('新建工作');
      if(!name||editing)name=answer(await p.text({message:'工作中文名',placeholder:name,defaultValue:name,validate:s=>validation(nameCheck)(s||name)}));
      if(!slug||editing)slug=answer(await p.text({message:'英文代号（小写字母、数字和连字符）',placeholder:slug,defaultValue:slug,validate:s=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s||slug||'')?undefined:'请输入有效英文代号'}));
      if(!o.date||editing)date=answer(await p.text({message:'工作日期',placeholder:date,defaultValue:date,validate:s=>validation(dateCheck)(s||date)}));
      p.log.info('Trellis 为必选管理入口，始终创建或关联；AGENTS.md 位于其根目录。');
      if(!components||editing)components=answer(await p.multiselect({message:'选择可选组成部分（可以不选，仅创建 Trellis）',options:[{value:'work',label:'work — 业务资料'},{value:'code',label:'code — 代码仓库'}],initialValues:components?.filter(c=>c!=='trellis')??['work'],required:false}));
      for(const kind of ['trellis','code'] as const) {
        const key=kind==='trellis'?'trellisExisting':'codeExisting';
        if(kind!=='trellis'&&!components!.includes(kind)){delete o[key];continue;}
        if(o[key]&&!editing)continue;
        const target=path.join(root,kind,slug!);
        const mode=answer(await p.select({message:`${kind} 目录${exists(target)?'（默认位置已存在）':''}`,options:[{value:'new',label:`新建 ${kind}/${slug}`},{value:'link',label:'关联已有仓库'}],initialValue:o[key]||exists(target)?'link':'new'}));
        if(mode==='link')o[key]=answer(await p.text({message:`已有 ${kind} 仓库路径（相对于 WorkHub）`,placeholder:o[key]??`${kind}/${slug}`,defaultValue:o[key]??`${kind}/${slug}`}));
        else delete o[key];
      }
      const expected=`${name}.code-workspace`;
      if(!o.workspaceName && (exists(path.join(root,'navigation/workspaces',expected)) || records(root).some(r=>r.workspace.expectedPath.toLowerCase()===`navigation/workspaces/${expected}`.toLowerCase()))) {
        const alternative=`${name}-${date.replaceAll('-','')}.code-workspace`;
        o.workspaceName=answer(await p.text({message:'工作区名称已占用，请指定新文件名',placeholder:alternative,defaultValue:alternative,validate:s=>validation(nameCheck)(s||alternative)}));
      }
    }
    components??=['work'];
    if(!name||!slug)fail('缺少 --name 或 --slug。',2);
    const input:InitInput={name:name!,slug:slug!,date,components:components!,trellisExisting:o.trellisExisting,codeExisting:o.codeExisting,workspaceName:o.workspaceName};
    const plan=makePlan(root,input);
    const decision=await approve(o,plan);
    if(decision==='edit'){editing=true;delete o.workspaceName;continue;}
    if(decision==='preview'){output(plan);return;}
    const result=init(root,input);output(result);
    if(result.check && !result.check.ok)process.exitCode=1;
    return;
    }
  });
options(program.command('list').description('列出已登记工作')).action((o:Opts)=>{const root=rootResolve(o.root);validateRoot(root);output(records(root));});
options(program.command('show <id>').description('显示工作位置和入口')).action((id:string,o:Opts)=>output(show(rootResolve(o.root),id)));
options(program.command('check [id]').description('只读检查结构和索引')).action((id:string|undefined,o:Opts)=>{const result=check(rootResolve(o.root),id);output(result);if(!result.ok)process.exitCode=1;});
program.configureOutput({writeErr:s=>{if(!jsonMode)process.stderr.write(s);}});
try { await program.parseAsync(); }
catch(e) {
  if(e instanceof CommanderError && e.exitCode===0)process.exitCode=0;
  else {
    const code=e instanceof WkError?e.code:e instanceof CommanderError||e instanceof ZodError?2:1;
    const message=e instanceof Error?e.message:String(e);
    if(jsonMode)output({ok:false,error:message,code}); else console.error(`错误：${message}`);
    process.exitCode=code;
  }
}
