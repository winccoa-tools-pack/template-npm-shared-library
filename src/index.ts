/**
 * WinCC OA UI PNL/XML Converter
 *
 * Provides reliable PNL ⇄ XML transformations for WinCC OA UI panels
 * using the WCCOAui manager under the hood.
 */

// Types
export { ConversionDirection, ConversionOptions, ConversionResult } from './types';

// Core converter
export { PnlXmlConverter } from './converter';

// Convenience API
export { pnlToXml, xmlToPnl } from './api';
