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

  static buildBatchFindIdsQuery(
    items: Array<{
      index: number;
      catalogLanguage: string;
      likePattern: string;
      year?: number;
    }>,
  ): Prisma.Sql | null {
    const hasItems = items.length > 0;
    if (!hasItems) {
      return null;
    }

    const subqueries: Prisma.Sql[] = [];

    for (const item of items) {
      const catalogLanguage = item.catalogLanguage;
      const yearFilter =
        item.year === undefined
          ? Prisma.empty
          : Prisma.sql`AND year = ${item.year}`;

      const subquery = Prisma.sql`
        SELECT ${item.index} AS idx, id
        FROM "Movie"
        WHERE language = ${catalogLanguage}
          AND unaccent(title) ILIKE unaccent(${item.likePattern}) ESCAPE '\\'
          ${yearFilter}
        ORDER BY "updatedAt" DESC
        LIMIT 1
      `;

      subqueries.push(subquery);
    }

    const unionSeparator = " UNION ALL ";
    const batchQuery = Prisma.join(subqueries, unionSeparator);
    return batchQuery;
  }

  private static escapeIlikeMetacharacters(value: string): string {
    return value
      .replaceAll("\\", "\\\\")
      .replaceAll("%", "\\%")
      .replaceAll("_", "\\_");
  }
}
