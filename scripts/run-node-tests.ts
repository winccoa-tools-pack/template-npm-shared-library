import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function collectTestFiles(rootDir: string): string[] {
    const out: string[] = [];
    const stack: string[] = [rootDir];

    while (stack.length > 0) {
        const dir = stack.pop()!;
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            continue;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }

            if (entry.isFile() && entry.name.endsWith('.test.ts')) {
                out.push(fullPath);
            }
        }
    }

    return out.sort();
}

// Collect CLI args but ignore option-like args (starting with '-')
const rawArgs = process.argv.slice(2);
const targets = rawArgs.filter((a) => !a.startsWith('-'));
if (targets.length === 0) {
    console.error('Usage: node --import tsx scripts/run-node-tests.ts <file|dir> [file|dir...]');
    process.exit(2);
}

const cwd = process.cwd();
const files = targets.flatMap((t) => {
    const resolved = path.resolve(cwd, t);
    try {
        const stat = fs.statSync(resolved);
        if (stat.isFile() && resolved.endsWith('.test.ts')) {
            return [resolved];
        }
        if (stat.isDirectory()) {
            return collectTestFiles(resolved);
        }
    } catch {
        // ignore missing targets
    }
    return [] as string[];
});

if (files.length === 0) {
    console.error(`No '*.test.ts' files found under: ${targets.join(', ')}`);
    process.exit(1);
}

// Run tests one by one to better isolate failures
// Integration tests may leave resources hanging that interfere with subsequent tests
let failed = false;
for (const file of files) {
    const args = ['--import', 'tsx', '--test', '--test-force-exit', file];
    const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
    if (result.status !== 0) {
        failed = true;
    }
}
process.exit(failed ? 1 : 0);
