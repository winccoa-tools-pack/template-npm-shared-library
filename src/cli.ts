#!/usr/bin/env node

import { PnlXmlConverter } from './converter';
import { ConversionDirection } from './types';
import type { ConversionOptions } from './types';

/**
 * CLI exit codes.
 */
const EXIT_OK = 0;
const EXIT_USAGE = 1;
const EXIT_CONVERSION_FAILED = 2;

/**
 * Print usage information to stderr.
 */
function printUsage(): void {
    const bin = 'winccoa-pnl-xml';
    process.stderr.write(
        [
            '',
            `Usage: ${bin} <command> [options]`,
            '',
            'Commands:',
            '  convert pnl-to-xml <path>   Convert .pnl panel(s) to XML',
            '  convert xml-to-pnl <path>   Convert XML file(s) back to .pnl',
            '',
            'Options:',
            '  -v, --version <ver>   WinCC OA version (e.g. 3.20)  [required]',
            '  -c, --config <path>   WinCC OA project config file',
            '  -o, --overwrite       Overwrite existing output files',
            '  -t, --timeout <ms>    Process timeout in milliseconds (default: 60000)',
            '  -h, --help            Show this help message',
            '',
            'Examples:',
            `  ${bin} convert pnl-to-xml panels/myPanel.pnl -v 3.20`,
            `  ${bin} convert xml-to-pnl panels/myPanel.xml -v 3.20 -o`,
            `  ${bin} convert pnl-to-xml panels/ -v 3.20 --timeout 120000`,
            '',
        ].join('\n'),
    );
}

/**
 * Minimal argument parser.
 * Returns the parsed CLI options or null when the input is invalid.
 */
interface ParsedArgs {
    direction: ConversionDirection;
    inputPath: string;
    version: string;
    configPath?: string;
    overwrite: boolean;
    timeout?: number;
}

function parseArgs(argv: string[]): ParsedArgs | null {
    // Strip node + script path
    const args = argv.slice(2);

    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
        return null;
    }

    // Expect: convert <pnl-to-xml|xml-to-pnl> <path> [options]
    if (args[0] !== 'convert') {
        process.stderr.write(`Error: Unknown command "${args[0]}". Expected "convert".\n`);
        return null;
    }

    const subCommand = args[1];
    let direction: ConversionDirection;

    if (subCommand === 'pnl-to-xml') {
        direction = ConversionDirection.PNL_TO_XML;
    } else if (subCommand === 'xml-to-pnl') {
        direction = ConversionDirection.XML_TO_PNL;
    } else {
        process.stderr.write(
            `Error: Unknown sub-command "${subCommand}". Expected "pnl-to-xml" or "xml-to-pnl".\n`,
        );
        return null;
    }

    const inputPath = args[2];
    if (!inputPath || inputPath.startsWith('-')) {
        process.stderr.write('Error: Missing input path.\n');
        return null;
    }

    let version = '';
    let configPath: string | undefined;
    let overwrite = false;
    let timeout: number | undefined;

    // Parse remaining flags
    let i = 3;
    while (i < args.length) {
        const flag = args[i];
        switch (flag) {
            case '-v':
            case '--version':
                version = args[++i] ?? '';
                break;
            case '-c':
            case '--config':
                configPath = args[++i] ?? '';
                break;
            case '-o':
            case '--overwrite':
                overwrite = true;
                break;
            case '-t':
            case '--timeout': {
                const raw = args[++i] ?? '';
                const parsed = Number(raw);
                if (isNaN(parsed) || parsed <= 0) {
                    process.stderr.write(`Error: Invalid timeout value "${raw}".\n`);
                    return null;
                }
                timeout = parsed;
                break;
            }
            default:
                process.stderr.write(`Error: Unknown option "${flag}".\n`);
                return null;
        }
        i++;
    }

    if (!version) {
        process.stderr.write('Error: WinCC OA version is required (-v / --version).\n');
        return null;
    }

    return { direction, inputPath, version, configPath, overwrite, timeout };
}

/**
 * Main CLI entry point.
 */
async function main(): Promise<void> {
    const parsed = parseArgs(process.argv);

    if (!parsed) {
        printUsage();
        process.exitCode = EXIT_USAGE;
        return;
    }

    const options: ConversionOptions = {
        version: parsed.version,
        inputPath: parsed.inputPath,
        configPath: parsed.configPath,
        overwrite: parsed.overwrite,
        timeout: parsed.timeout,
    };

    const directionLabel =
        parsed.direction === ConversionDirection.PNL_TO_XML ? 'PNL → XML' : 'XML → PNL';

    process.stderr.write(`Converting ${directionLabel}: ${parsed.inputPath}\n`);

    try {
        const converter = new PnlXmlConverter();
        const result = await converter.convert(options, parsed.direction);

        if (result.stdout) {
            process.stdout.write(result.stdout);
        }
        if (result.stderr) {
            process.stderr.write(result.stderr);
        }

        if (result.success) {
            process.stderr.write('Conversion completed successfully.\n');
            process.exitCode = EXIT_OK;
        } else {
            process.stderr.write(`Conversion failed with exit code ${result.exitCode}.\n`);
            process.exitCode = EXIT_CONVERSION_FAILED;
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: ${message}\n`);
        process.exitCode = EXIT_CONVERSION_FAILED;
    }
}

// Auto-run only when invoked directly (not when imported for testing)
const isDirectRun =
    process.argv[1] &&
    (process.argv[1].endsWith('cli.js') ||
        process.argv[1].endsWith('cli.ts') ||
        process.argv[1].endsWith('cli.cjs') ||
        process.argv[1].endsWith('cli.mjs'));

if (isDirectRun) {
    main();
}

// Export for testing
export { parseArgs, printUsage, main };
