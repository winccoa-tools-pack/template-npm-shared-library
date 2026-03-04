import { PnlXmlConverter } from './converter';
import { ConversionDirection, ConversionOptions, ConversionResult } from './types';

/**
 * Shared converter instance used by the convenience functions.
 */
const converter = new PnlXmlConverter();

/**
 * Convert a WinCC OA .pnl panel file (or directory of panels) to XML.
 *
 * This is a convenience wrapper around {@link PnlXmlConverter.convert}
 * with the direction pre-set to PNL → XML.
 *
 * @param options - Conversion options (version, inputPath, etc.)
 * @returns Conversion result
 *
 * @example
 * ```ts
 * const result = await pnlToXml({
 *     version: '3.20',
 *     inputPath: 'panels/myPanel.pnl',
 * });
 * console.log(result.success); // true
 * ```
 */
export async function pnlToXml(options: ConversionOptions): Promise<ConversionResult> {
    return converter.convert(options, ConversionDirection.PNL_TO_XML);
}

/**
 * Convert a WinCC OA XML file (or directory of XML files) back to .pnl.
 *
 * This is a convenience wrapper around {@link PnlXmlConverter.convert}
 * with the direction pre-set to XML → PNL.
 *
 * @param options - Conversion options (version, inputPath, etc.)
 * @returns Conversion result
 *
 * @example
 * ```ts
 * const result = await xmlToPnl({
 *     version: '3.20',
 *     inputPath: 'panels/myPanel.xml',
 * });
 * console.log(result.success); // true
 * ```
 */
export async function xmlToPnl(options: ConversionOptions): Promise<ConversionResult> {
    return converter.convert(options, ConversionDirection.XML_TO_PNL);
}
