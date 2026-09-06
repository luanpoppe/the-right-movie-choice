import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { Logger } from "@/lib/logger/logger";
import { GetUserMovieEntryUseCase } from "@/domains/movies/application/use-cases/get-user-movie-entry.use-case";
import { ListUserMovieEntriesUseCase } from "@/domains/movies/application/use-cases/list-user-movie-entries.use-case";
import { UpsertUserMovieEntryUseCase } from "@/domains/movies/application/use-cases/upsert-user-movie-entry.use-case";
import { UserMovieEntryValidationException } from "@/domains/movies/domain/exceptions/user-movie-entry-validation.exception";
import {
  UserMovieEntryListQueryDTO,
  UserMovieEntryListQueryDTOSchema,
  UserMovieEntryPatchDTO,
  UserMovieEntryPatchDTOSchema,
  UserMovieEntryTmdbIdParams,
  UserMovieEntryTmdbIdParamsSchema,
} from "../dto/user-movie-entry.dto";
import { UserMovieEntryRequestMapper } from "../mappers/user-movie-entry-request.mapper";
import { UserMovieEntryResponseMapper } from "../mappers/user-movie-entry-response.mapper";

export type UserMovieEntryControllerParams = {
  listUserMovieEntriesUseCase: ListUserMovieEntriesUseCase;
  getUserMovieEntryUseCase: GetUserMovieEntryUseCase;
  upsertUserMovieEntryUseCase: UpsertUserMovieEntryUseCase;
};

export type UserMovieEntryControllerHandlers = {
  list: (
    request: FastifyRequest<{ Querystring: UserMovieEntryListQueryDTO }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  getByTmdbId: (
    request: FastifyRequest<{ Params: UserMovieEntryTmdbIdParams }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
  patch: (
    request: FastifyRequest<{
      Params: UserMovieEntryTmdbIdParams;
      Body: UserMovieEntryPatchDTO;
    }>,
    reply: FastifyReply,
  ) => Promise<FastifyReply>;
};

export class UserMovieEntryController {
  static create(
    params: UserMovieEntryControllerParams,
  ): UserMovieEntryControllerHandlers {
    return {
      list: UserMovieEntryController.createListHandler(params),
      getByTmdbId: UserMovieEntryController.createGetByTmdbIdHandler(params),
      patch: UserMovieEntryController.createPatchHandler(params),
    };
  }

  private static createListHandler(params: UserMovieEntryControllerParams) {
    return async (
      request: FastifyRequest<{ Querystring: UserMovieEntryListQueryDTO }>,
      reply: FastifyReply,
    ) => {
      const userId = UserMovieEntryController.getUserId(request);

      Logger.info("📋 Listing user movie entries", { userId });

      const query = UserMovieEntryController.parseOrThrow(
        UserMovieEntryListQueryDTOSchema,
        request.query,
      );
      const filter = UserMovieEntryRequestMapper.toListFilter(query);

      const entries = await params.listUserMovieEntriesUseCase.execute(
        userId,
        filter,
      );
      const responseBody =
        UserMovieEntryResponseMapper.toListEntriesResponse(entries);

      Logger.debug("✅ User movie entries listed", {
        userId,
        count: entries.length,
      });

      return reply.status(200).send(responseBody);
    };
  }

  private static createGetByTmdbIdHandler(
    params: UserMovieEntryControllerParams,
  ) {
    return async (
      request: FastifyRequest<{ Params: UserMovieEntryTmdbIdParams }>,
      reply: FastifyReply,
    ) => {
      const userId = UserMovieEntryController.getUserId(request);
      const routeParams = UserMovieEntryController.parseOrThrow(
        UserMovieEntryTmdbIdParamsSchema,
        request.params,
      );
      const tmdbId = routeParams.tmdbId;

      Logger.info("🔍 Fetching user movie entry", { userId, tmdbId });

      const entry = await params.getUserMovieEntryUseCase.execute(
        userId,
        tmdbId,
      );

      if (!entry) {
        Logger.info("⚠️ User movie entry not found", { userId, tmdbId });
        return reply.status(404).send({ error: "User movie entry not found" });
      }

      const responseBody = UserMovieEntryResponseMapper.toGetEntryResponse(entry);

      return reply.status(200).send(responseBody);
    };
  }

  private static createPatchHandler(params: UserMovieEntryControllerParams) {
    return async (
      request: FastifyRequest<{
        Params: UserMovieEntryTmdbIdParams;
        Body: UserMovieEntryPatchDTO;
      }>,
      reply: FastifyReply,
    ) => {
      const userId = UserMovieEntryController.getUserId(request);
      const routeParams = UserMovieEntryController.parseOrThrow(
        UserMovieEntryTmdbIdParamsSchema,
        request.params,
      );
      const tmdbId = routeParams.tmdbId;
      const patchDto = UserMovieEntryController.parseOrThrow(
        UserMovieEntryPatchDTOSchema,
        request.body,
      );
      const patch = UserMovieEntryRequestMapper.toPatchDomain(patchDto);

      Logger.info("💾 Patching user movie entry", { userId, tmdbId });

      const entry = await params.upsertUserMovieEntryUseCase.execute(
        userId,
        tmdbId,
        patch,
      );
      const responseBody = UserMovieEntryResponseMapper.toPatchEntryResponse(entry);

      if (entry) {
        Logger.debug("✅ User movie entry patched", { userId, tmdbId });
      } else {
        Logger.info("✅ User movie entry removed after patch", { userId, tmdbId });
      }

      return reply.status(200).send(responseBody);
    };
  }

  private static getUserId(request: FastifyRequest): number {
    const auth = request.userMovieEntryAuth;

    if (!auth) {
      throw new UserMovieEntryValidationException(
        "Authenticated user context is required",
      );
    }

    return auth.userId;
  }

  private static parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
    const parsed = schema.safeParse(data);

    if (parsed.success) {
      return parsed.data;
    }

    const firstIssue = parsed.error.issues[0];
    const message = firstIssue?.message ?? "Validation failed";

    throw new UserMovieEntryValidationException(message);
  }
}
