import test from 'node:test';
import assert from 'node:assert/strict';

import { parseArgs } from '../../src/cli';
import { ConversionDirection } from '../../src/types';

test('parseArgs: returns null for --help', () => {
    const parsed = parseArgs(['node', 'cli.ts', '--help']);
    assert.equal(parsed, null);
});

test('parseArgs: parses a valid pnl-to-xml command', () => {
    const parsed = parseArgs([
        'node',
        'cli.ts',
        'convert',
        'pnl-to-xml',
        'about.pnl',
        '--version',
        '3.20',
        '--config',
        'config/config',
        '--overwrite',
        '--timeout',
        '120000',
    ]);

    assert.ok(parsed);
    assert.equal(parsed.direction, ConversionDirection.PNL_TO_XML);
    assert.equal(parsed.inputPath, 'about.pnl');
    assert.equal(parsed.version, '3.20');
    assert.equal(parsed.configPath, 'config/config');
    assert.equal(parsed.overwrite, true);
    assert.equal(parsed.timeout, 120000);
});

test('parseArgs: rejects invalid timeout values', () => {
    const originalWrite = process.stderr.write.bind(process.stderr);
    let stderr = '';
    (process.stderr.write as unknown as (chunk: string) => boolean) = (chunk: string) => {
        stderr += chunk;
        return true;
    };

    try {
        const parsed = parseArgs([
            'node',
            'cli.ts',
            'convert',
            'xml-to-pnl',
            'about.xml',
            '-v',
            '3.20',
            '--timeout',
            'not-a-number',
        ]);

        assert.equal(parsed, null);
        assert.match(stderr, /Invalid timeout value/);
    } finally {
        process.stderr.write = originalWrite;
    }
});
