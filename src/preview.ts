import path from 'node:path';
import { exists, gitRoot, same } from './common.js';
import type { Plan } from './core.js';

export function previewLines(plan: Plan | {root:string;directories:string[];gitUser?:string;trellis?:string}): string[] {
  if ('record' in plan) {
    const {record:r,root}=plan;
    const parts=[
      {label:'Trellis · Codex 主目录',component:r.components.trellis},
      {label:'Work · 业务资料',component:r.components.work},
      ...r.components.code.map(component=>({label:'Code · 代码仓库',component}))
    ].filter(p=>p.component!==undefined);
    return [
      `工作名称  ${r.name}`,`工作编号  ${r.id}`,`工作日期  ${r.createdDate}`,
      '根目录',`  ${root}`,'',
      '目录安排：',
      ...parts.flatMap(({label,component:c})=>[
        `  ${label}  [${c!.mode==='linked'?'关联已有':exists(path.join(root,c!.path))?'已存在，保留':'创建'}]`,
        `    ${c!.path}/`
      ]),'',
      '管理信息：',
      ...(plan.existing?['  工作已登记，将检查现有记录。']:[
        '  在 Trellis 中创建任务、目录映射和交接入口。',
        '  更新工作登记与年度索引。',
        ...(parts.some(p=>p.component!.mode==='created')?['  新建目录分别使用独立 Git 仓库。']:[])
      ]),
      ...(plan.modifications.some(m=>m.includes('AGENTS.md'))?['  保留已有 AGENTS.md，追加 WorkHub 工作约定。']:[]),
      '', 'VS Code 工作区 · 仅预留位置',`  ${r.workspace.expectedPath}`,
      '  请在 VS Code 中手动创建并保存到此处。'
    ];
  }
  const navigation=path.join(plan.root,'navigation');
  const repo=gitRoot(navigation);
  return [
    `工作目录  ${plan.root}`,`Git 用户  ${plan.gitUser??'未设置'}`,`Trellis   ${plan.trellis??'待检查'}`,'',
    '公共目录：',
    ...plan.directories.filter(p=>!p.startsWith('.workhub')).map(p=>`  ${exists(path.join(plan.root,p))?'已存在，保留':'创建'}  ${p}/`),
    '',repo&&same(repo,navigation)?'navigation 已是 Git 仓库，保留现有仓库。':'navigation 将初始化为 Git 仓库。',
    '保存本机配置及 Git 用户名。','VS Code 工作区由你稍后创建。'
  ];
}

// Only a left flow line: no fixed-width box to misalign with CJK or long paths.
export function renderPreview(lines:string[]): string {
  return ['│','◇ 配置预览','│',...lines.map(line=>line?`│  ${line}`:'│'),'│'].join('\n');
}
