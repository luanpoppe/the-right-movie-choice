import { JoseAccessTokenProvider } from "@/modules/auth/infrastructure/providers/jose-access-token.provider";
import { GetUserMovieEntryUseCase } from "@/domains/movies/application/use-cases/get-user-movie-entry.use-case";
import { ListUserMovieEntriesUseCase } from "@/domains/movies/application/use-cases/list-user-movie-entries.use-case";
import { UpsertUserMovieEntryUseCase } from "@/domains/movies/application/use-cases/upsert-user-movie-entry.use-case";
import { UserMovieEntryController } from "../http/controllers/user-movie-entry.controller";
import { UserMovieEntryAuthHook } from "../http/hooks/user-movie-entry-auth.hook";
import { PrismaUserMovieEntryRepository } from "../repositories/user-movie-entry/prisma-user-movie-entry.repository";

export class MakeUserMovieEntryHttpFactory {
  static create() {
    const accessTokenProvider = new JoseAccessTokenProvider();
    const userMovieEntryRepository = new PrismaUserMovieEntryRepository();

    const listUserMovieEntriesUseCase = new ListUserMovieEntriesUseCase(
      userMovieEntryRepository,
    );
    const getUserMovieEntryUseCase = new GetUserMovieEntryUseCase(
      userMovieEntryRepository,
    );
    const upsertUserMovieEntryUseCase = new UpsertUserMovieEntryUseCase(
      userMovieEntryRepository,
    );

    const preHandler = UserMovieEntryAuthHook.createPreHandler({
      accessTokenProvider,
    });
    const handlers = UserMovieEntryController.create({
      listUserMovieEntriesUseCase,
      getUserMovieEntryUseCase,
      upsertUserMovieEntryUseCase,
    });

    return { preHandler, handlers };
  }
}
