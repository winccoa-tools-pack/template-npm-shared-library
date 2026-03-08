import fs from 'fs';

export type SpawnResultSummary = {
    status: number | null;
    signal?: NodeJS.Signals | null;
    stdout?: string | Buffer | null;
    stderr?: string | Buffer | null;
};

export function printLocalIntegrationTestResult(tag: string, result: SpawnResultSummary): void {
    // Keep this block stable so it can be copy-pasted into PRs when CI OOMs
    console.log('---');
    console.log('LOCAL INTEGRATION TEST RESULT (copy this into PR if CI OOMs)');
    console.log(`Test: ${tag}`);
    console.log('Exit status: ' + String(result.status));
    if (result.signal) {
        console.log('Signal: ' + String(result.signal));
    }
    if (result.stdout) {
        try {
            const out = typeof result.stdout === 'string' ? result.stdout : result.stdout.toString('utf8');
            console.log('--- STDOUT ---');
            console.log(out);
        } catch {
            // ignore
        }
    }
    if (result.stderr) {
        try {
            const err = typeof result.stderr === 'string' ? result.stderr : result.stderr.toString('utf8');
            console.log('--- STDERR ---');
            console.log(err);
        } catch {
            // ignore
        }
    }
    console.log('--- END LOCAL INTEGRATION TEST RESULT ---');
}
