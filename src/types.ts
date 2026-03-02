/**
 * Conversion direction for PNL ⇄ XML transformations.
 */
export enum ConversionDirection {
    /** Convert .pnl panel files to .xml */
    PNL_TO_XML = 'XML',
    /** Convert .xml files back to .pnl panels */
    XML_TO_PNL = 'PNL',
}

/**
 * Options for the PNL ⇄ XML conversion process.
 */
export interface ConversionOptions {
    /**
     * WinCC OA version to use (e.g., '3.20').
     * Required to locate the correct WCCOAui executable.
     */
    version: string;

    /**
     * Path to the panel file (.pnl) or directory to convert.
     *
     * WCCOAui resolves this path **relative to the project's `panels/`
     * directory**, so typically a bare filename like `"about.pnl"` or a
     * sub-path like `"sub/myPanel.pnl"` is expected — not an absolute path.
     */
    inputPath: string;

    /**
     * Whether to overwrite existing output files.
     * Maps to the `-o` flag of the UI manager.
     * @default false
     */
    overwrite?: boolean;

    /**
     * Path to the WinCC OA project config file.
     * Allows WCCOAui to locate a valid project context without registration.
     * Maps to the `-config` flag of the UI manager.
     */
    configPath?: string;

    /**
     * Timeout in milliseconds for the conversion process.
     * @default 60000
     */
    timeout?: number;
}

/**
 * Result of a PNL ⇄ XML conversion operation.
 */
export interface ConversionResult {
    /** Whether the conversion completed successfully (exit code 0). */
    success: boolean;

    /** Process exit code. */
    exitCode: number;

    /** Standard output captured from the UI manager process. */
    stdout: string;

    /** Standard error output captured from the UI manager process. */
    stderr: string;

    /** The input path that was converted. */
    inputPath: string;

    /** The conversion direction used. */
    direction: ConversionDirection;
}
