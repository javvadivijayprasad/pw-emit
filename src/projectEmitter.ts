/**
 * Scaffold a Playwright TypeScript project skeleton into `outDir`.
 *
 * Copies the four bundled templates (`package.json`, `playwright.config.ts`,
 * `tsconfig.json`, `gitignore`), substituting the simple placeholders:
 *
 *   {{projectName}}  → opts.projectName ?? "my-playwright-tests"
 *   {{baseUrl}}      → opts.baseUrl ?? "http://localhost:3000"
 *
 * Behaviour:
 *   - Files that already exist in `outDir` are NOT overwritten — instead
 *     they're surfaced as warnings. This matches sel2pw's behaviour.
 *   - The function is idempotent: a second call against an existing repo
 *     produces zero writes and returns warnings only.
 *
 * Lifted with light edits from sel2pw v1.0.0 `src/emitters/projectEmitter.ts`.
 */

import * as fs from "fs-extra";
import * as path from "path";
import type { ReviewItem } from "./types";

export interface EmitProjectOptions {
  outDir: string;
  /** Override the built-in templates directory. */
  templatesDir?: string;
  /** Injected as the `baseURL` in `playwright.config.ts`. */
  baseUrl?: string;
  /** Injected as the `name` in `package.json`. */
  projectName?: string;
  /**
   * v1.3.0 — how to render emitted devDependency versions. `caret`
   * (default) emits `^1.45.0` style ranges — matches existing behavior.
   * `exact` strips the leading `^` so the project pins to the exact
   * version. Useful for teams that have been bitten by silent
   * minor-version Playwright bumps in CI. See TestForge handoff Issue 9.
   */
  dependencyStrategy?: "caret" | "exact";
}

export interface EmitProjectResult {
  filesWritten: string[];
  warnings: ReviewItem[];
}

const DEFAULT_TEMPLATES = path.resolve(__dirname, "..", "templates");

const TEMPLATE_MAPPING: ReadonlyArray<{ src: string; dest: string }> = [
  { src: "package.json.tmpl", dest: "package.json" },
  { src: "playwright.config.ts.tmpl", dest: "playwright.config.ts" },
  { src: "tsconfig.json.tmpl", dest: "tsconfig.json" },
  { src: "gitignore.tmpl", dest: ".gitignore" },
];

export async function emitProject(opts: EmitProjectOptions): Promise<EmitProjectResult> {
  const filesWritten: string[] = [];
  const warnings: ReviewItem[] = [];

  const templatesDir = opts.templatesDir ?? DEFAULT_TEMPLATES;
  const projectName = opts.projectName ?? "my-playwright-tests";
  const baseUrl = opts.baseUrl ?? "http://localhost:3000";

  await fs.ensureDir(opts.outDir);

  for (const { src, dest } of TEMPLATE_MAPPING) {
    const srcPath = path.join(templatesDir, src);
    const destPath = path.join(opts.outDir, dest);

    if (!(await fs.pathExists(srcPath))) {
      warnings.push({
        severity: "warn",
        message: `Template not found: ${srcPath} — skipping ${dest}`,
      });
      continue;
    }

    if (await fs.pathExists(destPath)) {
      warnings.push({
        severity: "info",
        file: destPath,
        message: `${dest} already exists — left untouched.`,
      });
      continue;
    }

    let content = await fs.readFile(srcPath, "utf8");
    content = content
      .replace(/\{\{projectName\}\}/g, projectName)
      .replace(/\{\{baseUrl\}\}/g, baseUrl);
    // v1.3.0 — pin emitted devDependency versions when requested.
    // Only applied to package.json; other templates may legitimately
    // use `^` for unrelated purposes (e.g. regex literals in
    // playwright.config). Surgical string-replace inside the
    // devDependencies block keeps the change auditable.
    if (dest === "package.json" && opts.dependencyStrategy === "exact") {
      content = content.replace(
        /("(?:@?[a-zA-Z0-9/_-]+)"\s*:\s*)"\^([^"]+)"/g,
        '$1"$2"',
      );
    }
    await fs.writeFile(destPath, content, "utf8");
    filesWritten.push(destPath);
  }

  // Common scaffolded directories
  for (const dir of ["pages", "tests"]) {
    await fs.ensureDir(path.join(opts.outDir, dir));
  }

  return { filesWritten, warnings };
}
