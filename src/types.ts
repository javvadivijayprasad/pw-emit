/**
 * Public IR types for `@vijaypjavvadi/pw-emit`.
 *
 * These are the shapes that emitters consume. They are intentionally **input
 * source agnostic** — neither Java/Selenium nor Gherkin idioms leak in.
 * Consumers (sel2pw, bdd2pw) build these IRs from their own sources.
 *
 * Design rule: method bodies and test bodies arrive **pre-rendered** as TS
 * source strings. This package does NOT rewrite bodies — it places them
 * inside a class wrapper, indents them, and worries about imports.
 */

// --- Locators --------------------------------------------------------------

/**
 * A locator choice that has already been decided by the caller.
 * `pw-emit` does not pick locators — it renders the choice.
 */
export interface LocatorChoice {
  /** The Playwright locator API to call. */
  api:
    | "getByRole"
    | "getByLabel"
    | "getByPlaceholder"
    | "getByTestId"
    | "getByText"
    | "locator";
  /**
   * The argument expression as it should appear inside the parens, e.g.
   *   `'button', { name: 'Sign in' }`
   *   `'#login'`
   *   `'xpath=//div[@id="x"]'`
   */
  args: string;
  /** camelCase TS field name (e.g. `submitButton`). */
  fieldName: string;
}

// --- Page Objects ----------------------------------------------------------

export interface PomMethodIR {
  name: string;
  params: { name: string; type: string }[];
  /**
   * Pre-rendered TS body. Should already contain `await`s, already use
   * `this.<field>`, and already be valid TS. `pw-emit` only handles indentation.
   */
  body: string;
  jsdoc?: string;
  /** Defaults to `Promise<void>`. */
  returnType?: string;
}

export interface PageObjectIR {
  className: string;
  fields: LocatorChoice[];
  methods: PomMethodIR[];
  /** Optional extra import lines (e.g. shared types). The default
   *  `import { Page, Locator, expect } from '@playwright/test'` is always emitted. */
  extraImports?: string[];
}

// --- Test specs ------------------------------------------------------------

export interface TestCaseIR {
  name: string;
  /** Pre-rendered TS body. */
  body: string;
  jsdoc?: string;
  /** Fixtures destructured in the test signature. Defaults to `['page']`. */
  fixtures?: string[];
  /** Tags emitted as `// @tag` comments above the test. */
  tags?: string[];
  /** When set, emit `test.fixme(...)` instead of `test(...)` with this reason. */
  fixme?: string;
}

export interface HookIR {
  /** Pre-rendered TS body. */
  body: string;
  /** Fixtures destructured in the hook signature. Defaults to `['page']`. */
  fixtures?: string[];
}

export interface TestSpecIR {
  /** Used as the `test.describe(...)` title. */
  describeName: string;
  /** Page Object imports to add at top of file. */
  pomImports?: { className: string; fromPath: string }[];
  beforeAll?: HookIR[];
  beforeEach?: HookIR[];
  afterEach?: HookIR[];
  afterAll?: HookIR[];
  tests: TestCaseIR[];
  /** Optional extra import lines. */
  extraImports?: string[];
  /**
   * v1.1.0 — extra named imports to merge into the `@playwright/test`
   * import. E.g. `["type APIResponse"]` produces
   * `import { test, expect, type APIResponse } from "@playwright/test";`
   * instead of the default `import { test, expect } from ...`.
   * Used by bdd2pw v3.0.0 to surface the APIResponse type when API steps
   * are present in the feature.
   */
  playwrightImports?: string[];
  /**
   * v1.1.0 — pre-rendered TS lines emitted inside `test.describe(...)`
   * before any hooks or tests. Used for describe-scoped state — e.g.
   * `let apiResponse: APIResponse | null = null;` shared across the
   * tests in the block. Each line is emitted at one indent level
   * deeper than the describe call.
   */
  describeBodyPrelude?: string;
}

// --- Reporting -------------------------------------------------------------

export interface ReviewItem {
  severity: "info" | "warn" | "error";
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
}

// --- Result ----------------------------------------------------------------

export interface EmitResult {
  /** Final TS source. Always ends with a single trailing newline. */
  contents: string;
  warnings: ReviewItem[];
}
