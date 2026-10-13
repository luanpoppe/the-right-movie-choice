import { MovieRatingUtils } from "../movie-rating.utils";

describe("MovieRatingUtils.format", () => {
  it("formata a nota com uma casa decimal", () => {
    expect(MovieRatingUtils.format(8.4283)).toBe("8.4");
  });

  it("mantém uma casa decimal em inteiros", () => {
    expect(MovieRatingUtils.format(8)).toBe("8.0");
  });

  it("arredonda para uma casa", () => {
    expect(MovieRatingUtils.format(7.26)).toBe("7.3");
  });

  it("retorna null para valor nulo ou ausente", () => {
    expect(MovieRatingUtils.format(null)).toBeNull();
    expect(MovieRatingUtils.format(undefined)).toBeNull();
  });

  it("retorna null para valor não finito", () => {
    expect(MovieRatingUtils.format(Number.NaN)).toBeNull();
  });
});
