import { StringUtils } from "../string.utils";

describe("StringUtils.isEmptyString", () => {
  it("é verdadeiro para vazio, null e undefined", () => {
    expect(StringUtils.isEmptyString("")).toBe(true);
    expect(StringUtils.isEmptyString(null)).toBe(true);
    expect(StringUtils.isEmptyString(undefined)).toBe(true);
  });

  it("é falso para string com conteúdo", () => {
    expect(StringUtils.isEmptyString("token")).toBe(false);
  });
});
