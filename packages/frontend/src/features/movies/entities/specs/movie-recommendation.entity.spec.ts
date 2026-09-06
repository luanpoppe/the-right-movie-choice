import {
  MultipleMoviesRecommendationsSchema,
  SingleMovieReccomendationSchema,
  type SingleMovieReccomendationEntity,
} from "../movie-recommendation.entity";

class MovieRecommendationEntityFixtures {
  static singleMovie() {
    return {
      title: "Fight Club",
      director: "David Fincher",
      actors: ["Brad Pitt", "Edward Norton"],
      releaseYear: 1999,
      streamingPlatform: "Prime Video",
      imdbRating: 8.8,
      synopsis: "An insomniac office worker forms an underground fight club.",
      whySuggestion: "Dark psychological thriller that matches the mood.",
      durationInMinutes: 139,
    };
  }

  static movies(count: number) {
    const template = MovieRecommendationEntityFixtures.singleMovie();
    return Array.from({ length: count }, () => ({ ...template }));
  }
}

describe("SingleMovieReccomendationSchema", () => {
  it("REQ-6: aceita payload com tmdbId e imdbId do contrato público", () => {
    const movie = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      tmdbId: 550,
      imdbId: "tt0137523",
    };

    const parsed = SingleMovieReccomendationSchema.parse(movie);

    expect(parsed.tmdbId).toBe(550);
    expect(parsed.imdbId).toBe("tt0137523");
  });

  it("REQ-6: tipo inferido expõe tmdbId e imdbId como opcionais", () => {
    const withIds: SingleMovieReccomendationEntity =
      SingleMovieReccomendationSchema.parse({
        ...MovieRecommendationEntityFixtures.singleMovie(),
        tmdbId: 550,
        imdbId: "tt0137523",
      });
    const withoutIds: SingleMovieReccomendationEntity =
      SingleMovieReccomendationSchema.parse(
        MovieRecommendationEntityFixtures.singleMovie(),
      );

    expect(withIds.tmdbId).toBe(550);
    expect(withIds.imdbId).toBe("tt0137523");
    expect(withoutIds.tmdbId).toBeUndefined();
    expect(withoutIds.imdbId).toBeUndefined();
  });

  it("REQ-2: aceita filme sem tmdbId nem imdbId após miss no catálogo", () => {
    const movie = MovieRecommendationEntityFixtures.singleMovie();
    const parsed = SingleMovieReccomendationSchema.parse(movie);

    expect(parsed).toEqual(movie);
    expect(parsed).not.toHaveProperty("tmdbId");
    expect(parsed).not.toHaveProperty("imdbId");
  });

  it("REQ-4: aceita filme só com tmdbId sem imdbId", () => {
    const movie = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      tmdbId: 603,
    };
    const parsed = SingleMovieReccomendationSchema.parse(movie);

    expect(parsed.tmdbId).toBe(603);
    expect(parsed).not.toHaveProperty("imdbId");
  });

  it("REQ-5: rejeita tmdbId zero", () => {
    const movie = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      tmdbId: 0,
    };
    const parseResult = SingleMovieReccomendationSchema.safeParse(movie);

    expect(parseResult.success).toBe(false);
  });

  it("aceita tmdbId como string numerica via coerce", () => {
    const movie = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      tmdbId: "27205",
    };
    const parsed = SingleMovieReccomendationSchema.parse(movie);

    expect(parsed.tmdbId).toBe(27205);
  });

  it("rejeita imdbId string vazia", () => {
    const movie = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      imdbId: "",
    };
    const parseResult = SingleMovieReccomendationSchema.safeParse(movie);

    expect(parseResult.success).toBe(false);
  });

  it("aceita imdbId null e omite a propriedade na saida", () => {
    const movie = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      tmdbId: 603,
      imdbId: null,
    };
    const parseResult = SingleMovieReccomendationSchema.safeParse(movie);

    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.tmdbId).toBe(603);
      expect(parseResult.data).not.toHaveProperty("imdbId");
    }
  });
});

describe("MultipleMoviesRecommendationsSchema", () => {
  it("cada filme segue REQ-1 ou REQ-2 independentemente no array", () => {
    const withIds = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      title: "Inception",
      tmdbId: 27205,
      imdbId: "tt1375666",
    };
    const withoutIds = {
      ...MovieRecommendationEntityFixtures.singleMovie(),
      title: "Obscure Indie",
    };

    const parsed = MultipleMoviesRecommendationsSchema.parse([
      withIds,
      withoutIds,
    ]);

    expect(parsed[0]?.tmdbId).toBe(27205);
    expect(parsed[0]?.imdbId).toBe("tt1375666");
    expect(parsed[1]).not.toHaveProperty("tmdbId");
    expect(parsed[1]).not.toHaveProperty("imdbId");
  });
});
