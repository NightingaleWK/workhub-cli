import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { check,init,install,installPlan,makePlan,show,writeIndexes } from '../src/core.js';
import { inside,dateCheck,nameCheck,readJson,withLock,same,globalGitUser } from '../src/common.js';
import { trellisPreflight } from '../src/trellis.js';

// Core tests isolate the external Trellis process. Real adapter acceptance is
// performed separately with the official CLI, never claimed by these fixtures.
vi.mock('../src/trellis.js',async(importOriginal)=>{
 const actual=await importOriginal<typeof import('../src/trellis.js')>();
 return {...actual,
  trellisPreflight:vi.fn(()=>({command:'fixture',prefix:[],version:'fixture',python:'fixture'})),
  initTrellis:(dir:string)=>{fs.mkdirSync(path.join(dir,'.trellis/scripts'),{recursive:true});fs.writeFileSync(path.join(dir,'.trellis/scripts/task.py'),'# test fixture');},
  createTask:(base:string,record:any)=>{
   const rel=`${record.components.trellis.path}/.trellis/tasks/${record.id}`;
   fs.mkdirSync(path.join(base,rel),{recursive:true});
   for(const [file,body] of Object.entries({'task.json':JSON.stringify({id:record.id}),'workhub-context.md':record.id,'workhub-handoff.md':'fixture handoff'})) {
    const target=path.join(base,rel,file);if(!fs.existsSync(target))fs.writeFileSync(target,body);
   }
   return rel;
  }
 };
});

let temp:string,root:string;
let priorGitConfig:string|undefined;
beforeEach(()=>{
 temp=fs.mkdtempSync(path.join(os.tmpdir(),'workhub-test-'));root=path.join(temp,'中文 WorkHub');process.env.WORKHUB_CONFIG_PATH=path.join(temp,'local.json');
 priorGitConfig=process.env.GIT_CONFIG_GLOBAL;
 process.env.GIT_CONFIG_GLOBAL=path.join(temp,'gitconfig');
 fs.writeFileSync(process.env.GIT_CONFIG_GLOBAL,'[user]\n\tname = workhub-test-user\n');
});
afterEach(()=>{
 delete process.env.WORKHUB_CONFIG_PATH;
 if(priorGitConfig===undefined)delete process.env.GIT_CONFIG_GLOBAL;else process.env.GIT_CONFIG_GLOBAL=priorGitConfig;
 fs.rmSync(temp,{recursive:true,force:true});
});
const input=(extra={})=>({name:'测试工作',slug:'sample',date:'2026-09-24',components:['work','code'],...extra});
describe('workspace behaviors',()=>{
 it('requires manual identity without a global Git name, before any root writes',()=>{
  fs.writeFileSync(process.env.GIT_CONFIG_GLOBAL!,'');
  expect(globalGitUser()).toBeUndefined();expect(()=>install(root)).toThrow('Git 用户名');
  expect(fs.existsSync(root)).toBe(false);
  install(root,'manual-user');expect((readJson(path.join(root,'.workhub/config.json')) as any).gitUser).toBe('manual-user');
 });
 it('requires Trellis even with no optional components and normalizes explicit selection',()=>{
  install(root);
  const a=makePlan(root,input({components:[]}));
  expect(a.record.components.trellis?.path).toBe('trellis/sample');
  expect(a.record.components.work).toBeUndefined();expect(a.record.components.code).toEqual([]);
  expect(a.record.requestHash).toBe(makePlan(root,input({components:['trellis']})).record.requestHash);
  expect(init(root,input({components:[]})).check.ok).toBe(true);
 });
 it('fails before creating project directories when the mandatory dependency is missing',()=>{
  install(root);vi.mocked(trellisPreflight).mockImplementationOnce(()=>{throw new Error('Trellis unavailable');});
  expect(()=>init(root,input())).toThrow('Trellis unavailable');
  expect(fs.existsSync(path.join(root,'code/sample'))).toBe(false);
  expect(fs.existsSync(path.join(root,'knowledge/work/2026'))).toBe(false);
  expect(fs.readdirSync(path.join(root,'navigation/registry/works'))).toEqual([]);
 });
 it('flags records without required Trellis components',()=>{
  install(root);const r=init(root,input());
  const f=path.join(root,`navigation/registry/works/${r.record.id}.json`);const invalid=readJson(f) as any;
  delete invalid.components.trellis;delete invalid.taskPath;fs.writeFileSync(f,JSON.stringify(invalid));const before=fs.readFileSync(f,'utf8');
  expect(check(root).errors.some(s=>s.includes('Trellis 主目录'))).toBe(true);
  expect(()=>makePlan(root,input())).toThrow('工作缺少');expect(fs.readFileSync(f,'utf8')).toBe(before);
 });
 it('installs idempotently, preserves user README and does not create root git',()=>{
  install(root);fs.writeFileSync(path.join(root,'navigation/README.md'),'用户说明');install(root);
  expect(fs.readFileSync(path.join(root,'navigation/README.md'),'utf8')).toBe('用户说明');
  expect(fs.existsSync(path.join(root,'.git'))).toBe(false);
  expect(fs.existsSync(path.join(root,'navigation/.git'))).toBe(true);
  expect((readJson(path.join(root,'.workhub/config.json')) as any).gitUser).toBe(globalGitUser());
 });
 it('persists an explicitly supplied Git username for future Trellis initialization',()=>{
  install(root,'人工填写的名字');expect((readJson(path.join(root,'.workhub/config.json')) as any).gitUser).toBe('人工填写的名字');
 });
 it('dry plan creates nothing and rejects unknown populated roots',()=>{
  installPlan(root);expect(fs.existsSync(root)).toBe(false);
  fs.mkdirSync(root);fs.writeFileSync(path.join(root,'original.txt'),'keep');expect(()=>installPlan(root)).toThrow('非空');
 });
 it('creates separate repos, pre-reserves workspace, generates deterministic indexes',()=>{
  install(root);const r=init(root,input());expect(r.check.ok).toBe(true);
  expect(r.record.id).toBe('20260924-sample');
  expect(fs.existsSync(path.join(root,'code/sample/.git'))).toBe(true);
  const agents=fs.readFileSync(path.join(root,'trellis/sample/AGENTS.md'),'utf8');
  expect(agents).toContain('<!-- WORKHUB:START v1 -->');
  expect(agents).toContain('<!-- WORKHUB:END -->');
  expect(fs.existsSync(path.join(root,r.record.taskPath!,'workhub-context.md'))).toBe(true);
  expect(fs.existsSync(path.join(root,r.record.taskPath!,'workhub-handoff.md'))).toBe(true);
  expect(show(root,r.record.id).workspace).toBe('待创建');
  const f=path.join(root,'navigation/indexes/工作目录/2026.md');const old=fs.readFileSync(f,'utf8');writeIndexes(root);expect(fs.readFileSync(f,'utf8')).toBe(old);
  fs.writeFileSync(path.join(root,'code/sample/README.md'),'user change');
  expect(init(root,input()).status).toBe('existing');expect(fs.readFileSync(path.join(root,'code/sample/README.md'),'utf8')).toBe('user change');
 });
 it.each([['work'],['code']])('supports %j without inventing missing components',(component)=>{
  install(root);const r=init(root,input({components:[component]}));expect(r.check.ok).toBe(true);
  expect(r.record.components.trellis?.path).toBe('trellis/sample');expect(r.record.components.work!==undefined).toBe(component==='work');
 });
 it('rejects collisions before writing other components',()=>{
  install(root);fs.mkdirSync(path.join(root,'code/sample'));fs.writeFileSync(path.join(root,'code/sample/keep'),'important');
  expect(()=>init(root,input())).toThrow('已存在');expect(fs.existsSync(path.join(root,'knowledge/work/2026'))).toBe(false);
  expect(fs.readFileSync(path.join(root,'code/sample/keep'),'utf8')).toBe('important');
 });
 it('links existing code and preserves dirty files and repository',()=>{
  install(root);init(root,input({components:['code']}));
  const f=path.join(root,'code/sample/user.txt');fs.writeFileSync(f,'dirty');
  const r=init(root,input({name:'第二次工作',slug:'second',date:'2027-01-01',codeExisting:'code/sample'}));
  expect(r.record.components.code[0]?.mode).toBe('linked');expect(fs.readFileSync(f,'utf8')).toBe('dirty');
  expect(r.record.components.work?.path).toContain('work/2027/');
 });
 it('detects a conflicting repeated ID and reserved workspace name',()=>{
  install(root);init(root,input());expect(()=>makePlan(root,input({name:'改名'}))).toThrow('参数不一致');
  expect(()=>makePlan(root,input({slug:'other'}))).toThrow('工作区');
 });
 it('checks index drift, missing files and missing workspace separately',()=>{
  install(root);init(root,input());expect(check(root).warnings.some(s=>s.includes('待创建'))).toBe(true);
  fs.writeFileSync(path.join(root,'navigation/indexes/工作目录/2026.md'),'bad');expect(check(root).ok).toBe(false);
  writeIndexes(root);expect(check(root).ok).toBe(true);
  fs.unlinkSync(path.join(root,'knowledge/work/2026/20260924-测试工作/README.md'));expect(check(root).ok).toBe(false);
 });
 it('guards locks and releases own lock after errors',()=>{
  install(root);expect(()=>withLock(root,()=>withLock(root,()=>{}))).toThrow('写锁');
  expect(fs.existsSync(path.join(root,'.workhub/write.lock'))).toBe(false);
 });
 it('rejects traversal and escaping junctions',()=>{
  install(root);expect(()=>inside(root,'../outside')).toThrow('越界');
  const outside=path.join(temp,'outside');fs.mkdirSync(outside);fs.symlinkSync(outside,path.join(root,'code/escape'),process.platform==='win32'?'junction':'dir');
  expect(()=>inside(root,'code/escape/file')).toThrow('越界');
 });
 it('retains recovery log and resumes after an interrupted directory operation',()=>{
  install(root);const r=init(root,input());
  // Simulate interruption immediately before registry publication, retaining owned files.
  fs.unlinkSync(path.join(root,`navigation/registry/works/${r.record.id}.json`));
  const log=path.join(root,`.workhub/runs/${r.record.id}.json`);const value=readJson(log) as any;value.status='failed';fs.writeFileSync(log,JSON.stringify(value));
  fs.writeFileSync(path.join(root,'code/sample/README.md'),'preserve after interruption');
  expect(init(root,input()).check.ok).toBe(true);expect(fs.readFileSync(path.join(root,'code/sample/README.md'),'utf8')).toBe('preserve after interruption');
 });
 it('recovers when registration succeeded but index publication was interrupted',()=>{
  install(root);const r=init(root,input());
  const log=path.join(root,`.workhub/runs/${r.record.id}.json`);const value=readJson(log) as any;value.status='failed';fs.writeFileSync(log,JSON.stringify(value));
  fs.unlinkSync(path.join(root,'navigation/indexes/工作目录/2026.md'));
  expect(init(root,input()).check.ok).toBe(true);
  expect((readJson(log) as any).status).toBe('complete');
 });
 it('rejects a nested Git root before initializing a hub',()=>{
  spawnSync('git',['init',temp],{encoding:'utf8'});
  expect(()=>installPlan(root)).toThrow('嵌套');
 });
});
describe('validation and CLI',()=>{
 it('reports the version from the package manifest',()=>{
  const expected=(readJson(path.resolve('package.json')) as {version:string}).version;
  const result=spawnSync(process.execPath,[path.resolve('dist/cli.js'),'--version'],{encoding:'utf8'});
  expect(result.status).toBe(0);expect(result.stdout.trim()).toBe(expected);
 });
 it('compares Windows short and long paths as the same repository',()=>{
  if(process.platform!=='win32')return;
  const longPath=path.join(temp,'Long Directory For Alias');fs.mkdirSync(longPath);
  const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$fso = New-Object -ComObject Scripting.FileSystemObject; $fso.GetFolder($env:WORKHUB_TEST_LONG_PATH).ShortPath"],{encoding:'utf8',env:{...process.env,WORKHUB_TEST_LONG_PATH:longPath},windowsHide:true});
  expect(result.status).toBe(0);const shortPath=result.stdout.trim();expect(shortPath.length).toBeGreaterThan(0);
  expect(same(shortPath,longPath)).toBe(true);
  expect(inside(shortPath,'child')).toBe(path.resolve(shortPath,'child'));
 });
 it.each(['CON','nul.txt','bad/name','trailing.','..'])('rejects unsafe name %s',n=>expect(()=>nameCheck(n)).toThrow());
 it('validates dates including leap year',()=>{expect(dateCheck('2024-02-29')).toBe('2024-02-29');expect(()=>dateCheck('2026-02-29')).toThrow();});
 it('uses clean JSON in non-TTY mode and does not wait for missing input',()=>{
  const cli=path.resolve('dist/cli.js');
  const fixture=path.join(temp,'bin/node_modules/@mindfoldhq/trellis/bin');
  fs.mkdirSync(fixture,{recursive:true});fs.writeFileSync(path.join(fixture,'trellis.js'),"console.log('test-fixture');");
  const invoke=(args:string[])=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:15000,env:{...process.env,PATH:path.join(temp,'bin')+path.delimiter+process.env.PATH,WORKHUB_CONFIG_PATH:path.join(temp,'local.json')}});
  const dry=invoke(['install','--root',root,'--dry-run','--json']);expect(dry.status).toBe(0);expect(JSON.parse(dry.stdout).root).toBe(root);expect(fs.existsSync(root)).toBe(false);
  expect(invoke(['install','--root',root,'--yes','--json']).status).toBe(0);
  const bad=invoke(['init','--json','--yes']);expect(bad.status).toBe(2);expect(JSON.parse(bad.stdout).ok).toBe(false);
  const planned=invoke(['init','--name','CLI测试','--slug','cli-test','--components','work','--dry-run','--json']);expect(planned.status).toBe(0);expect(JSON.parse(planned.stdout).record.components.trellis.path).toBe('trellis/cli-test');
  const only=invoke(['init','--name','仅管理','--slug','only','--components','none','--dry-run','--json']);expect(only.status).toBe(0);expect(JSON.parse(only.stdout).record.components.work).toBeUndefined();expect(JSON.parse(only.stdout).record.components.trellis).toBeDefined();
  const defaults=invoke(['init','--name','默认组件','--slug','defaults','--dry-run','--json']);expect(defaults.status).toBe(0);expect(JSON.parse(defaults.stdout).record.components.work).toBeDefined();
  const invalid=invoke(['init','--unknown','--json']);expect(invalid.status).toBe(2);expect(JSON.parse(invalid.stdout).ok).toBe(false);
 });
});
