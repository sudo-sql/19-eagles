/**
 * Minimal vitest-compatible layer over node:test + node:assert.
 * Keeps the test suites portable: swap this import for "vitest" and they run
 * unchanged under vitest in environments where the npm registry is available.
 */
import assert from "node:assert/strict";
import { describe as nodeDescribe, it as nodeIt } from "node:test";

export const describe = nodeDescribe;

type Fn = (...args: unknown[]) => unknown;

function formatName(template: string, args: unknown[]): string {
  let i = 0;
  return template.replace(/%[ids]/g, () => String(args[i++]));
}

function itFn(name: string, fn: Fn) {
  return nodeIt(name, fn as never);
}
itFn.each = (table: unknown[][]) => (name: string, fn: (...row: never[]) => unknown) => {
  for (const row of table) nodeIt(formatName(name, row), () => fn(...(row as never[])));
};
export const it = itFn;

class Expectation {
  private actual: unknown;
  private negate: boolean;
  constructor(actual: unknown, negate = false) {
    this.actual = actual;
    this.negate = negate;
  }
  get not() { return new Expectation(this.actual, !this.negate); }
  private check(pass: boolean, msg: string) {
    if (this.negate ? pass : !pass) {
      throw new assert.AssertionError({ message: (this.negate ? "NOT " : "") + msg });
    }
  }
  toBe(exp: unknown) { this.check(Object.is(this.actual, exp), `expected ${str(this.actual)} to be ${str(exp)}`); }
  toEqual(exp: unknown) {
    let pass = true;
    try { assert.deepStrictEqual(this.actual, exp); } catch { pass = false; }
    this.check(pass, `expected ${str(this.actual)} to deep-equal ${str(exp)}`);
  }
  toBeCloseTo(exp: number, digits = 2) {
    const pass = Math.abs((this.actual as number) - exp) < Math.pow(10, -digits) / 2;
    this.check(pass, `expected ${str(this.actual)} to be close to ${exp} (±10^-${digits}/2)`);
  }
  toBeGreaterThan(exp: number) { this.check((this.actual as number) > exp, `expected ${str(this.actual)} > ${exp}`); }
  toBeGreaterThanOrEqual(exp: number) { this.check((this.actual as number) >= exp, `expected ${str(this.actual)} >= ${exp}`); }
  toBeLessThan(exp: number) { this.check((this.actual as number) < exp, `expected ${str(this.actual)} < ${exp}`); }
  toBeLessThanOrEqual(exp: number) { this.check((this.actual as number) <= exp, `expected ${str(this.actual)} <= ${exp}`); }
  toContain(item: unknown) {
    const a = this.actual as { includes(x: unknown): boolean };
    this.check(a.includes(item), `expected ${str(this.actual)} to contain ${str(item)}`);
  }
  toHaveLength(n: number) {
    this.check((this.actual as { length: number }).length === n, `expected length ${n}, got ${(this.actual as { length: number }).length}`);
  }
  toMatch(re: RegExp | string) {
    const s = String(this.actual);
    this.check(typeof re === "string" ? s.includes(re) : re.test(s), `expected "${s}" to match ${re}`);
  }
  toMatchObject(exp: Record<string, unknown>) {
    const a = this.actual as Record<string, unknown>;
    let pass = true;
    for (const [k, v] of Object.entries(exp)) {
      try { assert.deepStrictEqual(a[k], v); } catch { pass = false; break; }
    }
    this.check(pass, `expected ${str(this.actual)} to match object ${str(exp)}`);
  }
  toBeTypeOf(t: string) { this.check(typeof this.actual === t, `expected typeof ${str(this.actual)} to be ${t}`); }
  toThrow() {
    let threw = false;
    try { (this.actual as Fn)(); } catch { threw = true; }
    this.check(threw, "expected function to throw");
  }
}

const str = (x: unknown) => {
  try { return JSON.stringify(x); } catch { return String(x); }
};

export const expect = (actual: unknown) => new Expectation(actual);
