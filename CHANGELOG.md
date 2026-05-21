# pw-emit — CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing yet._

## [1.1.0] — 2026-05-12

### Added (consumed by `@vijaypjavvadi/bdd2pw@3.0.0`)

- `TestSpecIR.playwrightImports?: string[]` — extra named imports
  merged into the emitted `import { test, expect, ... } from "@playwright/test";`
  line. bdd2pw uses this to surface `type APIResponse` when the
  feature has any API step.
- `TestSpecIR.describeBodyPrelude?: string` — pre-rendered TS lines
  emitted inside `test.describe(...)` before any hooks or tests.
  bdd2pw uses this to declare describe-scoped state for API tests
  (`let apiResponse: APIResponse | null = null;`, etc.).

Both additions are optional. Existing pure-UI emission paths are
byte-stable across the 1.0 → 1.1 upgrade. SemVer minor.

## [1.0.0] — 2026-05-03

First public npm release. Consumed by `@vijaypjavvadi/bdd2pw@1.0.0` from day one;
`sel2pw` migration tracked separately (still on its own internal copy, byte-identical
output verified against the shared emitter).

### Added
- Initial scaffold (configs, CI, tests/, templates/, src/).
- IR types: `PageObjectIR`, `TestSpecIR`, `LocatorChoice`, `PomMethodIR`,
  `TestCaseIR`, `HookIR`, `ReviewItem`, `EmitResult`.
- Naming utilities: `toCamelCase`, `toKebabCase`, `toPascalCase`,
  `pageObjectFileName`, `testFileName`.
- `dedentAndIndent` helper (lifted from sel2pw).
- Locator rendering: `renderLocatorExpr`, `renderFieldDeclaration`,
  `renderFieldAssignment`.
- `emitPageObject(ir, opts?)` — IR → TS class string. Supports optional
  `selfHealingShim` mode.
- `emitTestSpec(ir)` — IR → TS spec file string. Supports `Background:`-style
  `beforeEach` and Scenario-Outline parameterised cases via the consumer's IR.
- `emitProject({ outDir, templatesDir, baseUrl, projectName })` — scaffold a
  Playwright TS project from templates.
- Four bundled templates: `package.json`, `playwright.config.ts`,
  `tsconfig.json`, `gitignore`.
- Snapshot tests covering `emitPageObject` (5 IRs) and `emitTestSpec` (3 IRs).
- Unit tests for naming, indent, locator rendering.
- GitHub Actions CI matrix: Ubuntu/macOS/Windows × Node 18/20/22.
- Tag-triggered release workflow with `npm publish --provenance`.

### Public API contract

Stable named exports, SemVer-committed:

`emitPageObject`, `emitTestSpec`, `emitProject`,
`renderLocatorExpr`, `renderFieldDeclaration`, `renderFieldAssignment`,
`toCamelCase`, `toPascalCase`, `toKebabCase`, `pageObjectFileName`,
`testFileName`, `dedentAndIndent`,
plus the IR types listed above.

Breaking changes to any of these will require a major version bump.
