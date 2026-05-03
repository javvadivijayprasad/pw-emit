import { describe, it, expect } from "vitest";
import {
  toCamelCase,
  toPascalCase,
  toKebabCase,
  pageObjectFileName,
  testFileName,
} from "../../src/naming";

describe("toCamelCase", () => {
  it("PascalCase → camelCase", () => expect(toCamelCase("LoginPage")).toBe("loginPage"));
  it("snake_Case underscores → camelCase", () =>
    expect(toCamelCase("submit_btn")).toBe("submitBtn"));
  it("Foo_Bar_Baz mixed → camelCase", () =>
    expect(toCamelCase("CreateReferral_Link")).toBe("createReferralLink"));
  it("already camelCase preserved", () =>
    expect(toCamelCase("userInput")).toBe("userInput"));
  it("empty input passes through", () => expect(toCamelCase("")).toBe(""));
});

describe("toPascalCase", () => {
  it("kebab-case → PascalCase", () => expect(toPascalCase("login-page")).toBe("LoginPage"));
  it("snake_case → PascalCase", () => expect(toPascalCase("login_page")).toBe("LoginPage"));
  it("space separated → PascalCase", () =>
    expect(toPascalCase("login page")).toBe("LoginPage"));
  it("camelCase → PascalCase", () => expect(toPascalCase("loginPage")).toBe("LoginPage"));
  it("HTTPServer normalises to HttpServer", () =>
    expect(toPascalCase("HTTPServer")).toBe("Httpserver"));
});

describe("toKebabCase", () => {
  it("PascalCase → kebab-case", () => expect(toKebabCase("LoginPage")).toBe("login-page"));
  it("snake_case → kebab-case", () => expect(toKebabCase("submit_btn")).toBe("submit-btn"));
  it("camelCase → kebab-case", () => expect(toKebabCase("userInput")).toBe("user-input"));
});

describe("pageObjectFileName", () => {
  it("LoginPage → login.page.ts", () =>
    expect(pageObjectFileName("LoginPage")).toBe("login.page.ts"));
  it("LoginPages → login.page.ts", () =>
    expect(pageObjectFileName("LoginPages")).toBe("login.page.ts"));
  it("LoginPageObject → login.page.ts", () =>
    expect(pageObjectFileName("LoginPageObject")).toBe("login.page.ts"));
  it("LoginPageObjects → login.page.ts", () =>
    expect(pageObjectFileName("LoginPageObjects")).toBe("login.page.ts"));
  it("LoginScreen → login.page.ts (mobile alt)", () =>
    expect(pageObjectFileName("LoginScreen")).toBe("login.page.ts"));
  it("LoginView → login.page.ts (alt)", () =>
    expect(pageObjectFileName("LoginView")).toBe("login.page.ts"));
  it("LoginSection stays as login-section.page.ts (sub-area)", () =>
    expect(pageObjectFileName("LoginSection")).toBe("login-section.page.ts"));
});

describe("testFileName", () => {
  it("LoginTest → login.spec.ts", () =>
    expect(testFileName("LoginTest")).toBe("login.spec.ts"));
  it("LoginTests → login.spec.ts", () =>
    expect(testFileName("LoginTests")).toBe("login.spec.ts"));
  it("LoginTestCase → login.spec.ts", () =>
    expect(testFileName("LoginTestCase")).toBe("login.spec.ts"));
});
