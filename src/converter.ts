import { UIComponent } from '@winccoa-tools-pack/npm-winccoa-core/types/components/implementations/UIComponent';
import { ConversionDirection, ConversionOptions, ConversionResult } from './types';

/**
 * Default timeout for conversion processes (60 seconds).
 */
const DEFAULT_TIMEOUT = 60_000;

/**
 * Core converter class for PNL ⇄ XML transformations.
 *
 * Uses the WinCC OA UI manager (`WCCOAui`) under the hood to perform
 * conversions via the `-xmlConvert` flag.
 *
 * **Important:** WCCOAui converts files **in-place**.  A `.bak` backup of the
 * original content is created next to the input file, and the file itself is
 * rewritten with the converted content.
 *
 * The `inputPath` used with `-p` is resolved **relative to the project's
 * `panels/` directory**, so pass a bare filename (e.g. `"about.pnl"`)
 * rather than an absolute path.
 *
 * @example
 * ```ts
 * const converter = new PnlXmlConverter();
 * const result = await converter.convert({
 *     version: '3.20',
 *     inputPath: 'myPanel.pnl',
 *     configPath: '/path/to/project/config/config',
 * }, ConversionDirection.PNL_TO_XML);
 * ```
 */
export class PnlXmlConverter {
    private ui: UIComponent;

    constructor() {
        this.ui = new UIComponent();
    }

    /**
     * Build the argument list for the UI manager process.
     *
     * @param options  - Conversion options
     * @param direction - Conversion direction
     * @returns Array of CLI arguments
     */
    private buildArgs(options: ConversionOptions, direction: ConversionDirection): string[] {
        const args: string[] = [];

        // -xmlConvert=XML  → PNL to XML
        // -xmlConvert=PNL  → XML to PNL
        args.push(`-xmlConvert=${direction}`);

        // Panel or directory path
        args.push('-p', options.inputPath);

        // Overwrite existing output files
        if (options.overwrite) {
            args.push('-o');
        }

        // Project config path
        if (options.configPath) {
            args.push('-config', options.configPath);
        }

        // Do not connect to WCCILevent
        args.push('-n');

        return args;
    }

    /**
     * Run a conversion using the WinCC OA UI manager.
     *
     * @param options   - Conversion options (version, input path, etc.)
     * @param direction - Whether to convert PNL→XML or XML→PNL
     * @returns Conversion result including exit code and captured output
     */
    async convert(
        options: ConversionOptions,
        direction: ConversionDirection,
    ): Promise<ConversionResult> {
        const timeout = options.timeout ?? DEFAULT_TIMEOUT;

        // Set the WinCC OA version so that getPath() locates the correct executable
        this.ui.setVersion(options.version);

        const args = this.buildArgs(options, direction);

        const exitCode = await this.ui.start(args, { timeout });

        return {
            success: exitCode === 0,
            exitCode,
            stdout: this.ui.stdOut,
            stderr: this.ui.stdErr,
            inputPath: options.inputPath,
            direction,
        };
    }
}
