import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const cliPath = path.join(projectRoot, 'dist/cli.js');
const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function runCli(args: string[], env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8', windowsHide: true, env });
}

it('exposes workhub as the only package command and uses it in help', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8'));
  expect(manifest.bin).toEqual({ workhub: 'dist/cli.js' });
  expect(lock.packages[''].bin).toEqual(manifest.bin);

  const help = runCli(['--help']);
  expect(help.status).toBe(0);
  expect(help.stdout).toContain('Usage: workhub [options] [command]');
  const version = runCli(['--version']);
  expect(version.status).toBe(0);
  expect(version.stdout.trim()).toBe(manifest.version);
});

it('reads a work root configured before the command rename', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'workhub-cli-command-'));
  temporaryRoots.push(temp);
  const root = path.join(temp, 'WorkHub');
  const registry = path.join(root, 'navigation/registry/works');
  fs.mkdirSync(path.join(root, '.wk'), { recursive: true });
  fs.mkdirSync(registry, { recursive: true });
  fs.writeFileSync(path.join(root, '.wk/config.json'), JSON.stringify({ schemaVersion: 1, layoutVersion: 1, templateVersion: 1, gitUser: 'tester' }));
  const record = {
    schemaVersion: 1, id: '20260924-sample', name: '旧工作', slug: 'sample', createdDate: '2026-09-24', lifecycle: 'active',
    components: { trellis: { path: 'trellis/sample', mode: 'created' }, code: [] },
    operations: [], workspace: { expectedPath: 'navigation/workspaces/旧工作.code-workspace' }, requestHash: 'fixture',
  };
  fs.writeFileSync(path.join(registry, `${record.id}.json`), JSON.stringify(record));
  const pointer = path.join(temp, 'local.json');
  fs.writeFileSync(pointer, JSON.stringify({ schemaVersion: 1, root }));

  const result = runCli(['list', '--json'], { ...process.env, WK_CONFIG_PATH: pointer });
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout)).toMatchObject([{ id: record.id, name: record.name }]);
  expect(fs.readFileSync(pointer, 'utf8')).toBe(JSON.stringify({ schemaVersion: 1, root }));
});
