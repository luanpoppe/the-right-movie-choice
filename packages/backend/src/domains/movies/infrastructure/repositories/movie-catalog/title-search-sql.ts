import { Prisma } from "../../../../../../generated/prisma/client.js";

export type MovieCatalogTitleSearchBatchItem = {
  index: number;
  catalogLanguage: string;
  likePattern: string;
  year?: number;
};

export class MovieCatalogTitleSearchSql {
  static buildLikePattern(title: string): string {
    const escaped = MovieCatalogTitleSearchSql.escapeIlikeMetacharacters(title);
    return `%${escaped}%`;
  }

  static buildFindIdQuery(
    catalogLanguage: string,
    likePattern: string,
    year?: number,
  ): Prisma.Sql {
    const yearFilter =
      year === undefined ? Prisma.empty : Prisma.sql`AND year = ${year}`;

    return Prisma.sql`
      SELECT id
      FROM "Movie"
      WHERE language = ${catalogLanguage}
        AND unaccent(title) ILIKE unaccent(${likePattern}) ESCAPE '\\'
        ${yearFilter}
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `;
  }

  static buildBatchFindIdsQuery(
    items: MovieCatalogTitleSearchBatchItem[],
  ): Prisma.Sql | null {
    const hasItems = items.length > 0;
    if (!hasItems) {
      return null;
    }

    const valueRows: Prisma.Sql[] = [];

    for (const item of items) {
      const year = item.year;
      const hasYear = year !== undefined;
      const valueRow = hasYear
        ? Prisma.sql`(CAST(${item.index} AS INTEGER), ${item.catalogLanguage}, ${item.likePattern}, CAST(${year} AS INTEGER))`
        : Prisma.sql`(CAST(${item.index} AS INTEGER), ${item.catalogLanguage}, ${item.likePattern}, CAST(NULL AS INTEGER))`;
      valueRows.push(valueRow);
    }

    const valuesList = Prisma.join(valueRows);

    return Prisma.sql`
      SELECT ranked.idx, ranked.id
      FROM (
        SELECT
          q.idx,
          m.id,
          ROW_NUMBER() OVER (
            PARTITION BY q.idx
            ORDER BY m."updatedAt" DESC
          ) AS rn
        FROM (VALUES ${valuesList}) AS q(idx, lang, like_pattern, year)
        JOIN "Movie" m
          ON m.language = q.lang
         AND (q.year IS NULL OR m.year = q.year)
         AND unaccent(m.title) ILIKE unaccent(q.like_pattern) ESCAPE '\\'
      ) ranked
      WHERE ranked.rn = 1
    `;
  }

  private static escapeIlikeMetacharacters(value: string): string {
    return value
      .replaceAll("\\", "\\\\")
      .replaceAll("%", "\\%")
      .replaceAll("_", "\\_");
  }
}
