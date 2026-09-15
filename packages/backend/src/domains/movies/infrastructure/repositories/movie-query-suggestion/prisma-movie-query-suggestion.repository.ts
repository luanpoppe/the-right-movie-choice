import { Prisma } from "../../../../../../generated/prisma/client.js";
import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import type { IMovieQuerySuggestionRepository } from "../../../domain/repositories/movie-query-suggestion.repository";
import { MovieQuerySuggestionPoolConstants } from "../../../domain/movie-query-suggestion-pool.constants";
import { MovieQuerySuggestionNormalizeUtils } from "../../../domain/utils/movie-query-suggestion-normalize.utils";

export class PrismaMovieQuerySuggestionRepository
  implements IMovieQuerySuggestionRepository
{
  async count(): Promise<number> {
    const total = await prisma.movieQuerySuggestion.count();
    Logger.debug("Movie query suggestion pool count", { total });
    return total;
  }

  async listTexts(): Promise<string[]> {
    const rows = await prisma.movieQuerySuggestion.findMany({
      select: { text: true },
      orderBy: { createdAt: "asc" },
    });

    const texts = rows.map((row) => row.text);
    Logger.debug("Movie query suggestion texts listed", { count: texts.length });
    return texts;
  }

  async insertManySkipDuplicates(texts: string[]): Promise<number> {
    const data = texts
      .map((rawText) => MovieQuerySuggestionNormalizeUtils.normalize(rawText))
      .filter((fields) => fields.text.length > 0);

    if (data.length === 0) {
      Logger.debug("Movie query suggestion insert skipped — no valid texts");
      return 0;
    }

    const result = await prisma.movieQuerySuggestion.createMany({
      data,
      skipDuplicates: true,
    });

    Logger.info("Movie query suggestions batch insert", {
      attempted: data.length,
      inserted: result.count,
    });

    return result.count;
  }

  async pickRandomTexts(limit: number): Promise<string[]> {
    if (limit <= 0) {
      Logger.debug("Movie query suggestion random pick skipped — invalid limit", {
        limit,
      });
      return [];
    }

    const query = Prisma.sql`
      SELECT text
      FROM "MovieQuerySuggestion"
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
    const rows = await prisma.$queryRaw<{ text: string }[]>(query);
    const texts = rows.map((row) => row.text);

    Logger.debug("Movie query suggestion random texts picked", {
      requested: limit,
      count: texts.length,
    });

    return texts;
  }

  async withSeedLock<T>(operation: () => Promise<T>): Promise<T> {
    const lockKey = MovieQuerySuggestionPoolConstants.SEED_ADVISORY_LOCK_KEY;

    await prisma.$executeRawUnsafe(`SELECT pg_advisory_lock(${lockKey})`);

    try {
      const result = await operation();
      return result;
    } finally {
      await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(${lockKey})`);
    }
  }

  async rotatePoolAtomically(texts: string[]): Promise<void> {
    const data = texts
      .map((rawText) => MovieQuerySuggestionNormalizeUtils.normalize(rawText))
      .filter((fields) => fields.text.length > 0);

    const expectedCount = texts.length;
    const hasInvalidTexts = data.length !== expectedCount;
    if (hasInvalidTexts) {
      Logger.warn("Pool rotation aborted — empty texts after normalization", {
        expected: expectedCount,
        valid: data.length,
      });
      throw new Error(
        `Pool rotation aborted: expected ${expectedCount} valid texts, got ${data.length}`,
      );
    }

    await prisma.$transaction(async (tx) => {
      const insertResult = await tx.movieQuerySuggestion.createMany({
        data,
        skipDuplicates: true,
      });

      const insertedCount = insertResult.count;
      const isInsertIncomplete = insertedCount !== expectedCount;
      if (isInsertIncomplete) {
        Logger.warn("Pool rotation aborted — incomplete batch insert", {
          expected: expectedCount,
          inserted: insertedCount,
        });
        throw new Error(
          `Pool rotation aborted: expected ${expectedCount} inserts, got ${insertedCount}`,
        );
      }

      const oldestRows = await tx.movieQuerySuggestion.findMany({
        select: { id: true },
        orderBy: { createdAt: "asc" },
        take: expectedCount,
      });

      const oldestIds = oldestRows.map((row) => row.id);

      await tx.movieQuerySuggestion.deleteMany({
        where: { id: { in: oldestIds } },
      });
    });

    Logger.info("Movie query suggestion pool rotated", {
      inserted: expectedCount,
      removed: expectedCount,
    });
  }
}
