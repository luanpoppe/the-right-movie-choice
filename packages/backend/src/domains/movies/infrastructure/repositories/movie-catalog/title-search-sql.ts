import { Prisma } from "../../../../../../generated/prisma/client.js";

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

  private static escapeIlikeMetacharacters(value: string): string {
    return value
      .replaceAll("\\", "\\\\")
      .replaceAll("%", "\\%")
      .replaceAll("_", "\\_");
  }
}
