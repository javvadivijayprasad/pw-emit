import { describe, it, expect } from "vitest";
import { emitPageObject } from "../../src/pageObjectEmitter";
import type { PageObjectIR } from "../../src/types";

const minimal: PageObjectIR = {
  className: "EmptyPage",
  fields: [],
  methods: [],
};

const oneField: PageObjectIR = {
  className: "LandingPage",
  fields: [
    { api: "getByRole", args: "'heading', { name: 'Welcome' }", fieldName: "welcomeHeading" },
  ],
  methods: [],
};

const multiMethod: PageObjectIR = {
  className: "LoginPage",
  fields: [
    { api: "getByLabel", args: "'Username'", fieldName: "usernameInput" },
    { api: "getByLabel", args: "'Password'", fieldName: "passwordInput" },
    { api: "getByRole", args: "'button', { name: 'Sign in' }", fieldName: "signInButton" },
  ],
  methods: [
    {
      name: "goto",
      params: [],
      body: "await this.page.goto('/login');",
    },
    {
      name: "login",
      params: [
        { name: "user", type: "string" },
        { name: "pass", type: "string" },
      ],
      jsdoc: "/** Fill in the form and click sign in. */",
      body:
        "await this.usernameInput.fill(user);\n" +
        "await this.passwordInput.fill(pass);\n" +
        "await this.signInButton.click();",
    },
  ],
};

const withReturn: PageObjectIR = {
  className: "DashboardPage",
  fields: [
    { api: "getByTestId", args: "'user-name'", fieldName: "userName" },
  ],
  methods: [
    {
      name: "getUserName",
      params: [],
      returnType: "Promise<string>",
      body: "return await this.userName.innerText();",
    },
  ],
};

const withExtraImports: PageObjectIR = {
  className: "CheckoutPage",
  fields: [
    { api: "getByRole", args: "'button', { name: 'Place order' }", fieldName: "placeOrderButton" },
  ],
  methods: [],
  extraImports: [`import { Cart } from "../types/cart";`],
};

describe("emitPageObject snapshots", () => {
  it("empty class", () => {
    expect(emitPageObject(minimal).contents).toMatchInlineSnapshot(`
      "import { Page, Locator, expect } from "@playwright/test";

      export class EmptyPage {
        readonly page: Page;

        constructor(page: Page) {
          this.page = page;
        }
      }
      "
    `);
  });

  it("one field, no methods", () => {
    expect(emitPageObject(oneField).contents).toMatchInlineSnapshot(`
      "import { Page, Locator, expect } from "@playwright/test";

      export class LandingPage {
        readonly page: Page;
        readonly welcomeHeading: Locator;

        constructor(page: Page) {
          this.page = page;
          this.welcomeHeading = page.getByRole('heading', { name: 'Welcome' });
        }
      }
      "
    `);
  });

  it("multi-method LoginPage", () => {
    expect(emitPageObject(multiMethod).contents).toMatchInlineSnapshot(`
      "import { Page, Locator, expect } from "@playwright/test";

      export class LoginPage {
        readonly page: Page;
        readonly usernameInput: Locator;
        readonly passwordInput: Locator;
        readonly signInButton: Locator;

        constructor(page: Page) {
          this.page = page;
          this.usernameInput = page.getByLabel('Username');
          this.passwordInput = page.getByLabel('Password');
          this.signInButton = page.getByRole('button', { name: 'Sign in' });
        }

        async goto(): Promise<void> {
          await this.page.goto('/login');
        }

        /** Fill in the form and click sign in. */
        async login(user: string, pass: string): Promise<void> {
          await this.usernameInput.fill(user);
          await this.passwordInput.fill(pass);
          await this.signInButton.click();
        }
      }
      "
    `);
  });

  it("custom return type", () => {
    expect(emitPageObject(withReturn).contents).toContain(
      "async getUserName(): Promise<string>",
    );
  });

  it("self-healing shim wraps initialisers", () => {
    const out = emitPageObject(multiMethod, { selfHealingShim: true }).contents;
    expect(out).toContain("import { healOrThrow } from");
    expect(out).toContain("healOrThrow(page, {");
    expect(out).toContain('context: { page: "LoginPage", name: "usernameInput" }');
  });

  it("extraImports are appended after the default import", () => {
    const out = emitPageObject(withExtraImports).contents;
    expect(out).toContain('import { Cart } from "../types/cart";');
  });

  it("warns about duplicate field names", () => {
    const dup: PageObjectIR = {
      className: "DupPage",
      fields: [
        { api: "locator", args: "'#a'", fieldName: "a" },
        { api: "locator", args: "'#b'", fieldName: "a" },
      ],
      methods: [],
    };
    const r = emitPageObject(dup);
    expect(r.warnings.some((w) => w.message.includes("Duplicate field"))).toBe(true);
  });
});
