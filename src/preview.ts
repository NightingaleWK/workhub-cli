import path from 'node:path';
import { exists, gitRoot, same } from './common.js';
import type { Plan } from './core.js';

export function previewLines(plan: Plan | {root:string;directories:string[];gitUser?:string;trellis?:string}): string[] {
  if ('record' in plan) {
    const {record:r,root}=plan;
    const parts=[r.components.trellis,r.components.work,...r.components.code].filter(c=>c!==undefined);
    return [
      `工作名称  ${r.name}`,`工作编号  ${r.id}`,`工作目录  ${root}`,'',
      '目录安排：',
      ...parts.map(c=>`  ${c.mode==='linked'?'关联已有':exists(path.join(root,c.path))?'已存在，保留':'创建'}  ${c.path}/`),
      '',...plan.modifications,
      plan.existing?'工作已登记，将检查现有记录。':'新建目录将分别初始化 Git 仓库。',
      `工作区预留  ${r.workspace.expectedPath}`,
      'VS Code 工作区由你稍后创建。'
    ];
  }
  const navigation=path.join(plan.root,'navigation');
  const repo=gitRoot(navigation);
  return [
    `工作目录  ${plan.root}`,`Git 用户  ${plan.gitUser??'未设置'}`,`Trellis   ${plan.trellis??'待检查'}`,'',
    '公共目录：',
    ...plan.directories.filter(p=>!p.startsWith('.wk')).map(p=>`  ${exists(path.join(plan.root,p))?'已存在，保留':'创建'}  ${p}/`),
    '',repo&&same(repo,navigation)?'navigation 已是 Git 仓库，保留现有仓库。':'navigation 将初始化为 Git 仓库。',
    '保存本机配置及 Git 用户名。','VS Code 工作区由你稍后创建。'
  ];
}

// Only a left flow line: no fixed-width box to misalign with CJK or long paths.
export function renderPreview(lines:string[]): string {
  return ['│','◇ 配置预览','│',...lines.map(line=>line?`│  ${line}`:'│'),'│'].join('\n');
}
