# @vijaypjavvadi/pw-emit

[![npm version](https://img.shields.io/npm/v/@vijaypjavvadi/pw-emit.svg)](https://www.npmjs.com/package/@vijaypjavvadi/pw-emit)
[![npm downloads](https://img.shields.io/npm/dm/@vijaypjavvadi/pw-emit.svg)](https://www.npmjs.com/package/@vijaypjavvadi/pw-emit)
[![license](https://img.shields.io/npm/l/@vijaypjavvadi/pw-emit.svg)](https://www.npmjs.com/package/@vijaypjavvadi/pw-emit)

> Shared emitter library that renders Playwright TypeScript Page Objects, spec files, and project scaffolds from a generic IR.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Powers both [`@vijaypjavvadi/sel2pw`](https://github.com/javvadivijayprasad/sel2pw) (planned, post-v1.0) and [`@vijaypjavvadi/bdd2pw`](https://github.com/javvadivijayprasad/bdd2pw) (from day one).

## Why this exists

Both `sel2pw` (Selenium Java → Playwright TS) and `bdd2pw` (Gherkin → Playwright TS) need to emit the same shape of Page Objects, spec files, and project scaffolds. Without this package, they'd have two copies of the emitter — and divergence would be inevitable.

`pw-emit` is the **single source of truth** for what a generated Playwright TS file looks like. It does **not** parse Java, does **not** parse Gherkin — its inputs are clean IRs, and it produces TypeScript strings.

## Install

```bash
npm install @vijaypjavvadi/pw-emit
```

Peer dep: the **target** project (the one being scaffolded) needs `@playwright/test ≥ 1.40` — but `pw-emit` itself doesn't.

## Quick example

```ts
import { emitPageObject, type PageObjectIR } from "@vijaypjavvadi/pw-emit";

const ir: PageObjectIR = {
  className: "LoginPage",
  fields: [
    { api: "getByLabel", args: "'Username'", fieldName: "usernameInput" },
    { api: "getByLabel", args: "'Password'", fieldName: "passwordInput" },
    { api: "getByRole", args: "'button', { name: 'Sign in' }", fieldName: "signInButton" },
  ],
  methods: [
    {
      name: "login",
      params: [{ name: "user", type: "string" }, { name: "pass", type: "string" }],
      body: "await this.usernameInput.fill(user);\nawait this.passwordInput.fill(pass);\nawait this.signInButton.click();",
    },
  ],
};

const result = emitPageObject(ir);
console.log(result.contents);
```

Produces:

```ts
import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel("Username");
    this.passwordInput = page.getByLabel("Password");
    this.signInButton = page.getByRole("button", { name: "Sign in" });
  }

  async login(user: string, pass: string): Promise<void> {
    await this.usernameInput.fill(user);
    await this.passwordInput.fill(pass);
    await this.signInButton.click();
  }
}
```

## Public API

### Emitters

```ts
emitPageObject(ir: PageObjectIR, opts?: { selfHealingShim?: boolean }): EmitResult;
emitTestSpec(ir: TestSpecIR): EmitResult;
emitProject(opts: {
  outDir: string;
  templatesDir?: string;       // override the built-in templates
  baseUrl?: string;            // injected into playwright.config.ts
  projectName?: string;        // injected into package.json
}): Promise<{ filesWritten: string[]; warnings: ReviewItem[] }>;
```

### Locator rendering

```ts
renderLocatorExpr(choice: LocatorChoice, pageVar?: string): string;
renderFieldDeclaration(choice: LocatorChoice): string;       // "  readonly foo: Locator;"
renderFieldAssignment(choice: LocatorChoice, pageVar?: string): string;
```

### Naming + indent

```ts
toCamelCase(s: string): string;
toKebabCase(s: string): string;
toPascalCase(s: string): string;
pageObjectFileName(className: string): string;   // "LoginPage" → "login.page.ts"
testFileName(className: string): string;          // "LoginTest" → "login.spec.ts"
dedentAndIndent(body: string, prefix: string): string;
```

### IR types

`PageObjectIR`, `PomMethodIR`, `LocatorChoice`, `TestSpecIR`, `TestCaseIR`, `ReviewItem`, `EmitResult` — all exported from the root.

## Design rule that makes this work

**Method bodies arrive pre-rendered.** `pw-emit` does not transform method bodies — it places them inside a class wrapper, indents them correctly, and worries about imports. Each consumer (`sel2pw`, `bdd2pw`) is responsible for producing valid TS body strings from its own input.

This is the single decision that lets `sel2pw` (which rewrites raw Java method bodies) and `bdd2pw` (which assembles bodies from Gherkin step bindings) share an emitter without one having to know about the other's input format.

## SemVer commitments

- **Patch:** bug fixes, additive warnings, formatting tweaks.
- **Minor:** new exported helpers, new optional input fields (defaulted).
- **Major:** any change to the **emitted file shape** (POM/spec format), required input fields, or removed exports.

## License

MIT
