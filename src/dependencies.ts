import path from 'node:path';
import { exists, fail, run } from './common.js';

export const trellisPackage = '@mindfoldhq/trellis@latest';
export function npmCommand(): {command:string;prefix:string[]} {
  const dirs=[path.dirname(process.execPath),...(process.env.PATH??'').split(path.delimiter)];
  const candidates=[process.env.npm_execpath,...dirs.map(d=>path.join(d,'node_modules/npm/bin/npm-cli.js'))];
  for(const file of candidates) if(file && path.basename(file)==='npm-cli.js' && exists(file)) return {command:process.execPath,prefix:[file]};
  if(process.platform!=='win32')for(const dir of dirs)if(exists(path.join(dir,'npm')))return {command:path.join(dir,'npm'),prefix:[]};
  return fail('未找到 npm CLI，请确认 Node.js/npm 安装和 PATH。');
}
export function npmGlobalTrellis(): string | undefined {
  const npm=npmCommand();
  const root=run(npm.command,[...npm.prefix,'root','--global']);
  const file=path.join(root,'@mindfoldhq/trellis/bin/trellis.js');
  return exists(file)?file:undefined;
}
export function installTrellisPackage():void {
  const npm=npmCommand();
  run(npm.command,[...npm.prefix,'install','-g',trellisPackage]);
}

// Keep authorization and verification testable without actually mutating a global installation.
export async function ensureTrellis(
  detect:()=>unknown, consent:()=>Promise<boolean>, install:()=>void
):Promise<'existing'|'installed'> {
  if(detect())return 'existing';
  if(!await consent())fail('Trellis 是必需依赖；已取消配置，未安装 Trellis 或写入 WorkHub。',130);
  install();
  if(!detect())fail('npm 安装完成，但仍未找到 Trellis。请检查 npm 全局安装位置后重试。');
  return 'installed';
}
