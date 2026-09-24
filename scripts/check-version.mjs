#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] ?? fileURLToPath(new URL('../', import.meta.url)));
const manifestPath = path.join(root, 'package.json');
const lockPath = path.join(root, 'package-lock.json');
const cliPath = path.join(root, 'dist', 'cli.js');

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const version = manifest.version;
  if (typeof version !== 'string' || !version) throw new Error('package.json 缺少有效的 version。');

  const errors = [];
  if (lock.version !== version) errors.push(`package-lock.json 顶层版本 ${JSON.stringify(lock.version)} 与 package.json 版本 ${JSON.stringify(version)} 不一致。`);
  if (lock.packages?.['']?.version !== version) errors.push(`package-lock.json 根包版本 ${JSON.stringify(lock.packages?.['']?.version)} 与 package.json 版本 ${JSON.stringify(version)} 不一致。`);

  const cli = spawnSync(process.execPath, [cliPath, '--version'], { encoding: 'utf8', timeout: 10000, windowsHide: true });
  if (cli.error || cli.status !== 0) errors.push(`构建后的 CLI 无法读取版本：${cli.error?.message ?? cli.stderr.trim()}`);
  else if (cli.stdout.trim() !== version) errors.push(`构建后的 CLI 版本 ${JSON.stringify(cli.stdout.trim())} 与 package.json 版本 ${JSON.stringify(version)} 不一致。`);

  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`版本一致：${version}`);
} catch (error) {
  console.error(`版本检查失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
