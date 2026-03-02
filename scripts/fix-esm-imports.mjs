import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esmDir = path.join(projectRoot, 'dist', 'esm');

const EXTENSIONS = new Set(['.js', '.json', '.node']);

function withJsExtension(specifier) {
  if (!specifier.startsWith('.')) return specifier;

  // Split off query/hash if ever present.
  const match = /^(.*?)([?#].*)?$/.exec(specifier);
  const base = match?.[1] ?? specifier;
  const suffix = match?.[2] ?? '';

  if (base.endsWith('/')) return specifier;

  const ext = path.posix.extname(base);
  if (EXTENSIONS.has(ext)) return specifier;

  return `${base}.js${suffix}`;
}

function rewriteFile(contents) {
  let changed = false;

  // Rewrite: export * from '...'
  contents = contents.replace(
    /(\bexport\s+\*\s+from\s+)(['"])([^'"]+)(\2)/g,
    (full, prefix, quote, spec, suffixQuote) => {
      const next = withJsExtension(spec);
      if (next === spec) return full;
      changed = true;
      return `${prefix}${quote}${next}${suffixQuote}`;
    },
  );

  // Rewrite: export { ... } from '...'
  contents = contents.replace(
    /(\bexport\s+\{[^}]*\}\s+from\s+)(['"])([^'"]+)(\2)/g,
    (full, prefix, quote, spec, suffixQuote) => {
      const next = withJsExtension(spec);
      if (next === spec) return full;
      changed = true;
      return `${prefix}${quote}${next}${suffixQuote}`;
    },
  );

  // Rewrite: import ... from '...'
  contents = contents.replace(
    /(\bimport\s+[^;\n]+\s+from\s+)(['"])([^'"]+)(\2)/g,
    (full, prefix, quote, spec, suffixQuote) => {
      const next = withJsExtension(spec);
      if (next === spec) return full;
      changed = true;
      return `${prefix}${quote}${next}${suffixQuote}`;
    },
  );

  // Rewrite: import '...'
  contents = contents.replace(
    /(\bimport\s+)(['"])([^'"]+)(\2)/g,
    (full, prefix, quote, spec, suffixQuote) => {
      const next = withJsExtension(spec);
      if (next === spec) return full;
      changed = true;
      return `${prefix}${quote}${next}${suffixQuote}`;
    },
  );

  return { contents, changed };
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

async function main() {
  try {
    await fs.access(esmDir);
  } catch {
    console.error(`dist/esm not found: ${esmDir}`);
    process.exit(1);
  }

  let processed = 0;
  let rewritten = 0;

  for await (const filePath of walk(esmDir)) {
    if (!filePath.endsWith('.js')) continue;

    const original = await fs.readFile(filePath, 'utf8');
    const { contents, changed } = rewriteFile(original);

    processed++;
    if (changed) {
      await fs.writeFile(filePath, contents, 'utf8');
      rewritten++;
    }
  }

  console.log(`fix-esm-imports: processed ${processed} file(s), rewrote ${rewritten} file(s)`);
}

await main();
