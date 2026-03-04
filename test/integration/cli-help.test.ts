import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

test('CLI: "--help" prints usage and exits with code 1', () => {
    const repoRoot = path.resolve(__dirname, '..', '..');

    // Prefer the built CJS CLI (matches what users run via the npm bin entry).
    // Fall back to TS source so `npm run test:integration` can be run without a build.
    const distCli = path.join(repoRoot, 'dist', 'cjs', 'cli.js');
    const srcCli = path.join(repoRoot, 'src', 'cli.ts');

    const cliPath = fs.existsSync(distCli) ? distCli : srcCli;
    const nodeArgs =
        cliPath === srcCli
            ? ['--import', 'tsx', cliPath, '--help']
            : [cliPath, '--help'];

    const result = spawnSync(process.execPath, nodeArgs, {
        cwd: repoRoot,
        encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr ?? '', /Usage: winccoa-pnl-xml/);
});
