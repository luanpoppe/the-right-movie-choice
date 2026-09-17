import { FastifyInstance } from "fastify";
import { moviesQueryExamplesController } from "./movies-query-examples.controller";
import { MovieRecommendationDocs } from "../docs/movie-recommendation.docs";
import { MoviesQueryExamplesDocs } from "../docs/movies-query-examples.docs";
import {
  UserConversationCreateDocs,
  UserConversationDeleteDocs,
  UserConversationGetDocs,
  UserConversationListDocs,
  UserConversationPatchDocs,
} from "../docs/user-conversation.docs";
import {
  UserMovieEntryGetDocs,
  UserMovieEntryListDocs,
  UserMovieEntryPatchDocs,
} from "../docs/user-movie-entry.docs";
import { MakeMovieRecommendationHttpFactory } from "../../factories/make-movie-recommendation-http.factory";
import { MakeUserConversationHttpFactory } from "../../factories/make-user-conversation-http.factory";
import { MakeUserMovieEntryHttpFactory } from "../../factories/make-user-movie-entry-http.factory";

export async function moviesControllers(app: FastifyInstance) {
  const { preHandler, controller } = MakeMovieRecommendationHttpFactory.create();
  const userMovieEntryHttp = MakeUserMovieEntryHttpFactory.create();
  const userConversationHttp = MakeUserConversationHttpFactory.create();

  app.post(
    "/movie/recommendation",
    {
      ...MovieRecommendationDocs,
      preHandler,
    } as any,
    controller,
  );

  app.get(
    "/movie/queries",
    MoviesQueryExamplesDocs as any,
    moviesQueryExamplesController,
  );

  app.get(
    "/movie/user-entries",
    {
      ...UserMovieEntryListDocs,
      preHandler: userMovieEntryHttp.preHandler,
    } as any,
    userMovieEntryHttp.handlers.list,
  );

  app.get(
    "/movie/user-entries/:tmdbId",
    {
      ...UserMovieEntryGetDocs,
      preHandler: userMovieEntryHttp.preHandler,
    } as any,
    userMovieEntryHttp.handlers.getByTmdbId,
  );

  app.patch(
    "/movie/user-entries/:tmdbId",
    {
      ...UserMovieEntryPatchDocs,
      preHandler: userMovieEntryHttp.preHandler,
    } as any,
    userMovieEntryHttp.handlers.patch,
  );

  app.post(
    "/movie/conversations",
    {
      ...UserConversationCreateDocs,
      preHandler: userConversationHttp.preHandler,
    } as any,
    userConversationHttp.handlers.create,
  );

  app.get(
    "/movie/conversations",
    {
      ...UserConversationListDocs,
      preHandler: userConversationHttp.preHandler,
    } as any,
    userConversationHttp.handlers.list,
  );

  app.get(
    "/movie/conversations/:id",
    {
      ...UserConversationGetDocs,
      preHandler: userConversationHttp.preHandler,
    } as any,
    userConversationHttp.handlers.getById,
  );

  app.patch(
    "/movie/conversations/:id",
    {
      ...UserConversationPatchDocs,
      preHandler: userConversationHttp.preHandler,
    } as any,
    userConversationHttp.handlers.patch,
  );

  app.delete(
    "/movie/conversations/:id",
    {
      ...UserConversationDeleteDocs,
      preHandler: userConversationHttp.preHandler,
    } as any,
    userConversationHttp.handlers.delete,
  );
}
