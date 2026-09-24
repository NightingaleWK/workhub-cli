import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { afterEach,beforeEach,describe,expect,it } from 'vitest';
import { check,init,install,installPlan,makePlan,show,writeIndexes } from '../src/core.js';
import { inside,dateCheck,nameCheck,readJson,withLock } from '../src/common.js';

let temp:string,root:string;
beforeEach(()=>{temp=fs.mkdtempSync(path.join(os.tmpdir(),'wk-test-'));root=path.join(temp,'中文 WorkHub');process.env.WK_CONFIG_PATH=path.join(temp,'local.json');});
afterEach(()=>{delete process.env.WK_CONFIG_PATH;fs.rmSync(temp,{recursive:true,force:true});});
const input=(extra={})=>({name:'测试工作',slug:'sample',date:'2026-09-24',components:['work','code'],...extra});
describe('workspace behaviors',()=>{
 it('installs idempotently, preserves user README and does not create root git',()=>{
  install(root);fs.writeFileSync(path.join(root,'navigation/README.md'),'用户说明');install(root);
  expect(fs.readFileSync(path.join(root,'navigation/README.md'),'utf8')).toBe('用户说明');
  expect(fs.existsSync(path.join(root,'.git'))).toBe(false);
  expect(fs.existsSync(path.join(root,'navigation/.git'))).toBe(true);
 });
 it('dry plan creates nothing and rejects unknown populated roots',()=>{
  installPlan(root);expect(fs.existsSync(root)).toBe(false);
  fs.mkdirSync(root);fs.writeFileSync(path.join(root,'original.txt'),'keep');expect(()=>installPlan(root)).toThrow('非空');
 });
 it('creates separate repos, pre-reserves workspace, generates deterministic indexes',()=>{
  install(root);const r=init(root,input());expect(r.check.ok).toBe(true);
  expect(r.record.id).toBe('20260924-sample');
  expect(fs.existsSync(path.join(root,'code/sample/.git'))).toBe(true);
  expect(fs.existsSync(path.join(root,'trellis/sample'))).toBe(false);
  expect(show(root,r.record.id).workspace).toBe('待创建');
  const f=path.join(root,'navigation/indexes/工作目录/2026.md');const old=fs.readFileSync(f,'utf8');writeIndexes(root);expect(fs.readFileSync(f,'utf8')).toBe(old);
  fs.writeFileSync(path.join(root,'code/sample/README.md'),'user change');
  expect(init(root,input()).status).toBe('existing');expect(fs.readFileSync(path.join(root,'code/sample/README.md'),'utf8')).toBe('user change');
 });
 it.each([['work'],['code']])('supports %j without inventing missing components',(component)=>{
  install(root);const r=init(root,input({components:[component]}));expect(r.check.ok).toBe(true);
  expect(r.record.components.trellis).toBeUndefined();expect(r.record.components.work!==undefined).toBe(component==='work');
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
  expect(fs.existsSync(path.join(root,'.wk/write.lock'))).toBe(false);
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
  const log=path.join(root,`.wk/runs/${r.record.id}.json`);const value=readJson(log) as any;value.status='failed';fs.writeFileSync(log,JSON.stringify(value));
  fs.writeFileSync(path.join(root,'code/sample/README.md'),'preserve after interruption');
  expect(init(root,input()).check.ok).toBe(true);expect(fs.readFileSync(path.join(root,'code/sample/README.md'),'utf8')).toBe('preserve after interruption');
 });
 it('recovers when registration succeeded but index publication was interrupted',()=>{
  install(root);const r=init(root,input());
  const log=path.join(root,`.wk/runs/${r.record.id}.json`);const value=readJson(log) as any;value.status='failed';fs.writeFileSync(log,JSON.stringify(value));
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
 it.each(['CON','nul.txt','bad/name','trailing.','..'])('rejects unsafe name %s',n=>expect(()=>nameCheck(n)).toThrow());
 it('validates dates including leap year',()=>{expect(dateCheck('2024-02-29')).toBe('2024-02-29');expect(()=>dateCheck('2026-02-29')).toThrow();});
 it('uses clean JSON in non-TTY mode and does not wait for missing input',()=>{
  const cli=path.resolve('dist/cli.js');
  const invoke=(args:string[])=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:15000,env:{...process.env,WK_CONFIG_PATH:path.join(temp,'local.json')}});
  const dry=invoke(['install','--root',root,'--dry-run','--json']);expect(dry.status).toBe(0);expect(JSON.parse(dry.stdout).root).toBe(root);expect(fs.existsSync(root)).toBe(false);
  expect(invoke(['install','--root',root,'--yes','--json']).status).toBe(0);
  const bad=invoke(['init','--json','--yes']);expect(bad.status).toBe(2);expect(JSON.parse(bad.stdout).ok).toBe(false);
  const created=invoke(['init','--name','CLI测试','--slug','cli-test','--components','work','--yes','--json']);expect(created.status).toBe(0);expect(JSON.parse(created.stdout).status).toBe('created');
  const invalid=invoke(['init','--unknown','--json']);expect(invalid.status).toBe(2);expect(JSON.parse(invalid.stdout).ok).toBe(false);
 });
});
