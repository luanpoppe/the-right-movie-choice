import { describe, expect, it } from "vitest";
import { NullishUtils } from "../nullish.utils";

describe("NullishUtils", () => {
  describe("isNullish", () => {
    it("retorna true para null e undefined", () => {
      expect(NullishUtils.isNullish(null)).toBe(true);
      expect(NullishUtils.isNullish(undefined)).toBe(true);
    });

    it("retorna false para valores definidos", () => {
      expect(NullishUtils.isNullish(0)).toBe(false);
      expect(NullishUtils.isNullish("")).toBe(false);
      expect(NullishUtils.isNullish(false)).toBe(false);
    });
  });

  describe("isDefined", () => {
    it("retorna false para null e undefined", () => {
      expect(NullishUtils.isDefined(null)).toBe(false);
      expect(NullishUtils.isDefined(undefined)).toBe(false);
    });

    it("retorna true para valores definidos", () => {
      expect(NullishUtils.isDefined(0)).toBe(true);
      expect(NullishUtils.isDefined("")).toBe(true);
      expect(NullishUtils.isDefined(false)).toBe(true);
    });
  });
});
