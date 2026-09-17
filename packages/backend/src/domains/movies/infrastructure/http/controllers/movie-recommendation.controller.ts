import { FastifyReply, FastifyRequest } from "fastify";
import { CookieSerializeOptions } from "@fastify/cookie";
import { MovieRecommendationRequest } from "../dto/movie-recommendation.dto";

import { MissingHeaderException } from "@/core/exceptions/missing-header.exception";
import {
  HeadersDTO,
  HeadersDTOSchema,
} from "@/infrastructure/http/dto/headers.dto";
import {
  GetMovieRecommendationUseCase,
  GetMovieRecommendationUseCaseOptions,
} from "@/domains/movies/application/use-cases/get-movie-recommendation.use-case";
import { MakeGetMovieRecommendationUseCaseFactory } from "../../factories/make-get-movie-recommendation-use-case.factory";
import { GuestQuotaService } from "@/domains/movies/application/guest-quota.service";
import { GuestQuotaConstants } from "@/domains/movies/domain/guest-quota.constants";
import { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { IUserConversationRepository } from "@/domains/movies/domain/repositories/user-conversation.repository";
import { UserConversationEntity } from "@/domains/movies/domain/entities/user-conversation.entity";
import { UserConversationByChatIdNotFoundException } from "@/domains/movies/domain/exceptions/user-conversation-by-chat-id-not-found.exception";
import { Logger } from "@/lib/logger/logger";
import { env } from "@/env";
import { MovieRecommendationResponseMapper } from "../mappers/movie-recommendation-response.mapper";

type MovieRecommendationControllerDeps = {
  guestQuotaService: GuestQuotaService;
  catalogRepository: IMovieCatalogRepository;
};

type MovieRecommendationHandlerRequest = FastifyRequest<{
  Body: MovieRecommendationRequest;
  Headers: HeadersDTO;
}>;

type AuthenticatedConversationContext = {
  repository: IUserConversationRepository;
  conversation: UserConversationEntity;
  userId: number;
};

type RecommendationExecutionResult = {
  movies: Awaited<
    ReturnType<GetMovieRecommendationUseCase["execute"]>
  >["movies"];
  response: Awaited<
    ReturnType<GetMovieRecommendationUseCase["execute"]>
  >["response"];
  generatedTitle: string | null;
};

export class MovieRecommendationController {
  static create(deps: MovieRecommendationControllerDeps) {
    const { guestQuotaService, catalogRepository } = deps;
    const responseMapper = new MovieRecommendationResponseMapper(
      catalogRepository,
    );

    return async (
      request: MovieRecommendationHandlerRequest,
      reply: FastifyReply,
    ) => {
      const { userMessage } = request.body;
      const chatId = MovieRecommendationController.parseChatId(request);
      const movieAuth = request.movieAuth;

      const authContext =
        await MovieRecommendationController.loadAuthenticatedConversationContext(
          movieAuth,
          chatId,
        );

      if (authContext) {
        await MovieRecommendationController.touchConversationBeforeRecommendation(
          authContext,
          chatId,
        );
      }

      const useCaseOptions =
        MovieRecommendationController.resolveUseCaseOptions(request);
      const useCase =
        MakeGetMovieRecommendationUseCaseFactory.create(useCaseOptions);

      const executionResult =
        await MovieRecommendationController.executeRecommendation(
          useCase,
          userMessage,
          chatId,
          useCaseOptions,
          authContext,
        );

      const responseBody = await responseMapper.toResponse(
        executionResult.movies,
        executionResult.response,
      );

      if (authContext) {
        await MovieRecommendationController.saveGeneratedTitleIfAny(
          authContext,
          chatId,
          executionResult.generatedTitle,
        );
      }

      return MovieRecommendationController.sendResponse(
        reply,
        guestQuotaService,
        movieAuth,
        responseBody,
      );
    };
  }

  private static parseChatId(
    request: MovieRecommendationHandlerRequest,
  ): string {
    const parsed = HeadersDTOSchema.safeParse(request.headers);
    if (!parsed.success) throw new MissingHeaderException("chatid");

    const chatId = parsed.data.chatid;
    return chatId;
  }

  private static async loadAuthenticatedConversationContext(
    movieAuth: MovieRecommendationHandlerRequest["movieAuth"],
    chatId: string,
  ): Promise<AuthenticatedConversationContext | null> {
    const isAuthenticated =
      MovieRecommendationController.isAuthenticated(movieAuth);
    if (!isAuthenticated) return null;

    const userId = movieAuth.userId;
    const repository =
      MakeGetMovieRecommendationUseCaseFactory.createUserConversationRepository();
    const conversation = await repository.findByChatId(userId, chatId);

    if (!conversation) {
      Logger.debug("User conversation not found for recommendation", {
        userId,
        chatId,
      });
      throw new UserConversationByChatIdNotFoundException(chatId);
    }

    return { repository, conversation, userId };
  }

  private static async executeRecommendation(
    useCase: GetMovieRecommendationUseCase,
    userMessage: string,
    chatId: string,
    useCaseOptions: GetMovieRecommendationUseCaseOptions | undefined,
    authContext: AuthenticatedConversationContext | null,
  ): Promise<RecommendationExecutionResult> {
    const shouldGenerateTitle =
      authContext !== null && authContext.conversation.title === null;

    if (!shouldGenerateTitle) {
      const recommendationResult = await useCase.execute(
        userMessage,
        chatId,
        useCaseOptions,
      );
      return {
        movies: recommendationResult.movies,
        response: recommendationResult.response,
        generatedTitle: null,
      };
    }

    const titleGenerator =
      MakeGetMovieRecommendationUseCaseFactory.createConversationTitleGenerator();
    const executePromise = useCase.execute(userMessage, chatId, useCaseOptions);
    const titlePromise = titleGenerator.generateFromUserMessage(userMessage);

    const parallelResults = await Promise.all([executePromise, titlePromise]);
    const recommendationResult = parallelResults[0];
    const generatedTitle = parallelResults[1];

    return {
      movies: recommendationResult.movies,
      response: recommendationResult.response,
      generatedTitle,
    };
  }

  private static async touchConversationBeforeRecommendation(
    authContext: AuthenticatedConversationContext,
    chatId: string,
  ): Promise<void> {
    const { repository, userId } = authContext;
    const touchedConversation = await repository.touchUpdatedAt(userId, chatId);

    if (!touchedConversation) {
      Logger.debug("User conversation missing before recommendation turn", {
        userId,
        chatId,
      });
      throw new UserConversationByChatIdNotFoundException(chatId);
    }

    Logger.debug("Conversation updatedAt touched before recommendation", {
      userId,
      chatId,
    });
  }

  private static async saveGeneratedTitleIfAny(
    authContext: AuthenticatedConversationContext,
    chatId: string,
    generatedTitle: string | null,
  ): Promise<void> {
    if (generatedTitle === null) return;

    const { repository, conversation, userId } = authContext;
    const conversationId = conversation.id;

    await repository.updateTitle(userId, conversationId, generatedTitle);
    Logger.debug("Conversation title saved from recommendation turn", {
      userId,
      conversationId,
      chatId,
    });
  }

  private static async sendResponse(
    reply: FastifyReply,
    guestQuotaService: GuestQuotaService,
    movieAuth: MovieRecommendationHandlerRequest["movieAuth"],
    responseBody: unknown,
  ): Promise<FastifyReply> {
    const isAnonymous =
      movieAuth !== undefined && movieAuth.kind === "anonymous";

    if (!isAnonymous) {
      return reply.status(200).send(responseBody);
    }

    const guestId = movieAuth.guestId;
    const remaining = await guestQuotaService.incrementAfterSuccess(guestId);

    reply.setCookie(
      GuestQuotaConstants.COOKIE_NAME,
      guestId,
      MovieRecommendationController.guestIdCookieOptions(),
    );

    reply.header(
      GuestQuotaConstants.RESPONSE_HEADER_REMAINING,
      String(remaining),
    );

    return reply.status(200).send(responseBody);
  }

  private static isAuthenticated(
    movieAuth: MovieRecommendationHandlerRequest["movieAuth"],
  ): movieAuth is Extract<
    NonNullable<MovieRecommendationHandlerRequest["movieAuth"]>,
    { kind: "authenticated" }
  > {
    if (movieAuth === undefined) return false;
    if (movieAuth.kind !== "authenticated") return false;

    return true;
  }

  private static resolveUseCaseOptions(
    request: FastifyRequest<{ Body: MovieRecommendationRequest }>,
  ): GetMovieRecommendationUseCaseOptions | undefined {
    const movieAuth = request.movieAuth;
    const isAuthenticated =
      MovieRecommendationController.isAuthenticated(movieAuth);

    if (!isAuthenticated) {
      return undefined;
    }

    const bodyExcludeWatched = request.body.excludeWatched;
    const excludeWatched = bodyExcludeWatched ?? true;

    return {
      userId: movieAuth.userId,
      excludeWatched,
    };
  }

  private static guestIdCookieOptions(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === "prod",
      sameSite: "lax",
      path: "/",
      maxAge: GuestQuotaConstants.TTL_SECONDS,
    };
  }
}
