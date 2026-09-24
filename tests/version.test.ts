import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, expect, it } from 'vitest';

const checkScript = path.resolve('scripts/check-version.mjs');
const fixtures: string[] = [];

afterEach(() => { for (const root of fixtures.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function fixture(lockVersion = '1.2.3', rootVersion = '1.2.3', cliVersion = '1.2.3') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'workhub-version-check-'));
  fixtures.push(root);
  fs.mkdirSync(path.join(root, 'dist'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '1.2.3' }));
  fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({ version: lockVersion, packages: { '': { version: rootVersion } } }));
  fs.writeFileSync(path.join(root, 'dist/cli.js'), `console.log(${JSON.stringify(cliVersion)});`);
  return root;
}

const runCheck = (root: string) => spawnSync(process.execPath, [checkScript, root], { encoding: 'utf8' });

it('accepts matching manifest, lockfile and CLI versions', () => {
  const result = runCheck(fixture());
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('版本一致：1.2.3');
});

it('identifies both lockfile version fields when they drift', () => {
  const result = runCheck(fixture('1.2.2', '1.2.1'));
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('package-lock.json 顶层版本');
  expect(result.stderr).toContain('package-lock.json 根包版本');
});

it('identifies a stale CLI version', () => {
  const result = runCheck(fixture('1.2.3', '1.2.3', '1.2.2'));
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('构建后的 CLI 版本');
  expect(result.stderr).toContain('package.json 版本');
});
