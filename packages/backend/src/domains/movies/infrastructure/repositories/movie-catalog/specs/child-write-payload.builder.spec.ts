import { describe, it, expect } from "vitest";
import { MovieWatchProviderKind } from "../../../../../../../generated/prisma/client.js";
import { MovieCatalogChildWritePayloadBuilder } from "../child-write-payload.builder";

describe("MovieCatalogChildWritePayloadBuilder", () => {
  const movieId = 42;

  it("monta linhas de gênero, diretor e país de origem", () => {
    const genreRows = MovieCatalogChildWritePayloadBuilder.buildGenreRows(
      movieId,
      ["Ficção científica", "Drama"],
    );
    const directorRows = MovieCatalogChildWritePayloadBuilder.buildDirectorRows(
      movieId,
      ["Christopher Nolan"],
    );
    const originCountryRows =
      MovieCatalogChildWritePayloadBuilder.buildOriginCountryRows(movieId, ["US"]);

    expect(genreRows).toEqual([
      { movieId, name: "Ficção científica" },
      { movieId, name: "Drama" },
    ]);
    expect(directorRows).toEqual([{ movieId, name: "Christopher Nolan" }]);
    expect(originCountryRows).toEqual([{ movieId, code: "US" }]);
  });

  it("atribui sortOrder sequencial ao elenco", () => {
    const castRows = MovieCatalogChildWritePayloadBuilder.buildCastRows(movieId, [
      "Matthew McConaughey",
      "Anne Hathaway",
    ]);

    expect(castRows).toEqual([
      { movieId, name: "Matthew McConaughey", sortOrder: 0 },
      { movieId, name: "Anne Hathaway", sortOrder: 1 },
    ]);
  });

  it("monta watch providers por kind flatrate, rent e buy", () => {
    const rows = MovieCatalogChildWritePayloadBuilder.buildWatchProviderRows(
      movieId,
      {
        flatrate: [{ providerName: "Netflix", logoPath: "/n.png" }],
        rent: [{ providerName: "Apple TV", logoPath: null }],
        buy: [],
      },
    );

    expect(rows).toEqual([
      {
        movieId,
        kind: MovieWatchProviderKind.flatrate,
        providerName: "Netflix",
        logoPath: "/n.png",
      },
      {
        movieId,
        kind: MovieWatchProviderKind.rent,
        providerName: "Apple TV",
        logoPath: null,
      },
    ]);
  });

  it("devolve arrays vazios quando listas de filhos estão vazias", () => {
    expect(MovieCatalogChildWritePayloadBuilder.buildGenreRows(movieId, [])).toEqual(
      [],
    );
    expect(
      MovieCatalogChildWritePayloadBuilder.buildWatchProviderRows(movieId, {
        flatrate: [],
        rent: [],
        buy: [],
      }),
    ).toEqual([]);
  });
});
