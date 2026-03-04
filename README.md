---
Minimal starter template for creating shared WinCC OA NPM libraries
THIS IS AN EXAMPLE README
---


# WinCC OA UI PNL/XML Converter

A lightweight developer tool for SIMATIC WinCC Open Architecture projects, providing reliable PNL ⇄ XML transformations for UI panels.
This package is part of the modular winccoa-tools-pack ecosystem, which delivers modern development tooling,
reusable libraries, and VS Code extensions for WinCC OA engineers.
[github.com](https://github.com/winccoa-tools-pack)

## ✨ Features

- **PNL → XML conversion**  
  Transform classic .pnl UI panel files into structured XML suitable for analysis, automation, and editor tooling.

- **XML → PNL conversion**  
  Regenerate WinCC OA .pnl files from XML to enable round-trip workflows and external processing.

- **Tooling-friendly design**  
  Built to integrate with next-generation WinCC OA development tools such as VS Code extensions,
  reusable workflows, and advanced analysis pipelines,
  consistent with the overall goals of the winccoa-tools-pack organization.

- **Modern project template**  
  Generated from the shared npm-winccoa-template to ensure consistent structure, CI/CD, TypeScript setup, linting, and maintainability across the ecosystem.

## 📦 Installation

```shell
npm install @winccoa-tools-pack/npm-winccoa-ui-pnl-xml
```

Or globally:

```shell
npm install -g @winccoa-tools-pack/npm-winccoa-ui-pnl-xml
```

## 🖥 Usage (CLI)

```shell
# Convert .pnl → .xml (in-place)
winccoa-pnl-xml convert pnl-to-xml about.pnl --version 3.20

# Convert .xml → .pnl (in-place)
winccoa-pnl-xml convert xml-to-pnl about.xml --version 3.20

# Optional flags
#   --config <path>   Use a specific project config file
#   --overwrite       Overwrite existing output files
#   --timeout <ms>    Increase process timeout
```

## ⚠️ Important behavior

- Conversion is performed by WinCC OA `WCCOAui` and is **in-place** (the input file is rewritten).
- WinCC OA may create a `.bak` file next to the input.
- The input passed to `-p` is typically resolved relative to the project’s `panels/` directory.
  Use `--config` if you need to point the converter at a specific project context.

## 🧩 Usage (API)

```typescript
import { pnlToXml, xmlToPnl } from "@winccoa-tools-pack/npm-winccoa-ui-pnl-xml";

// Note: WinCC OA performs the conversion in-place and may create a .bak backup.
// The input path is typically resolved relative to the project’s panels/ directory.

const pnlToXmlResult = await pnlToXml({
  version: "3.20",
  inputPath: "about.pnl",
  // configPath: "C:/path/to/project/config/config",
  // overwrite: true,
  // timeout: 120_000,
});

if (!pnlToXmlResult.success) {
  throw new Error(`Conversion failed (exit ${pnlToXmlResult.exitCode}): ${pnlToXmlResult.stderr}`);
}

const xmlToPnlResult = await xmlToPnl({
  version: "3.20",
  inputPath: "about.xml",
});

console.log({ pnlToXmlResult, xmlToPnlResult });
```

More details: see [docs/USAGE.md](docs/USAGE.md).

## 🩺 Troubleshooting

- Non-zero exit code: inspect `stderr` and ensure `--version` matches your WinCC OA installation.
- Timeouts on large panels: increase `--timeout` / `timeout`.
- File not found: remember `inputPath` is usually relative to `panels/` in the active project context.

## 📚 Ecosystem Integration

This package is designed for seamless use with:

- **VS Code extensions for WinCC OA development**  
  Our open source community provides multiple VS Code tools that enhance the engineering workflow
  for WinCC OA developers. This converter acts as a foundation for UI-related features such as the Panel Explorer.

- **Node.js libraries**  
  Works side-by-side with other libraries in the winccoa-tools-pack suite (project management, core utilities, testing, etc.).

- **CI/CD automation**  
  Ideal for pipelines needing validation or transformation of UI panel resources.

- **Automation tokens** are recommended for CI/CD (they don't expire but can be revoked)
- The token needs **publish** permission for your package scope
- For scoped packages (`@winccoa-tools-pack/...`), ensure your NPM organization allows publishing

### Testing Without NPM_TOKEN

If `NPM_TOKEN` is not configured, the workflow will:

- ✅ Still run tests and build the package
- ✅ Create GitHub releases with artifacts
- ⚠️ Skip NPM publishing with a warning message

You can always publish manually later:

```bash
npm publish --access public
```

## 📦 Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## 🏆 Recognition

Special thanks to all our [contributors](https://github.com/orgs/winccoa-tools-pack/people) who make this project possible!

### Key Contributors

- **Martin Pokorny** ([@mPokornyETM](https://github.com/mPokornyETM)) - Creator & Lead Developer
- And many more amazing contributors!

---

## 📜 License

This project is basically licensed under the **MIT License** - see the [LICENSE](https://github.com/winccoa-tools-pack/.github/blob/main/LICENSE) file for details.

It might happen that partial repositories contain third party SW which uses other license models.

---

## ⚠️ Disclaimer

**WinCC OA** and **Siemens** are trademarks of Siemens AG.
This project is not affiliated with, endorsed by, or sponsored by Siemens AG.
This is a community-driven open source project created to enhance the development experience for WinCC OA developers.

---

## 🎉 Thank You

Thank you for using WinCC OA tools package! We're excited to be part of your development journey.

Happy Coding! 🚀

---

## Quick Links

[📦 VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mPokornyETM.wincc-oa-projects)

Made with ❤️ for and by the WinCC OA community
