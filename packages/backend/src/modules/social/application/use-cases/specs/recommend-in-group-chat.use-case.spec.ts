import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetMovieRecommendationUseCase } from "@/domains/movies/application/use-cases/get-movie-recommendation.use-case";
import type { MovieRecommendationEntity } from "@/domains/movies/domain/entities/movie-recommendation.entity";
import { ConversationTitleGenerator } from "@/domains/movies/infrastructure/providers/conversation-title.generator";
import type { GroupChatEntity } from "../../../domain/entities/group-chat.entity";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type { UserGroupEntity } from "../../../domain/entities/user-group.entity";
import { GroupChatNotFoundException } from "../../../domain/exceptions/group-chat-not-found.exception";
import { GroupChatValidationException } from "../../../domain/exceptions/group-chat-validation.exception";
import { NotGroupMemberException } from "../../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import type { IGroupChatRepository } from "../../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import {
  RecommendInGroupChatUseCase,
  type CreateGetMovieRecommendationUseCase,
} from "../recommend-in-group-chat.use-case";

describe("RecommendInGroupChatUseCase", () => {
  const userId = 7;
  const groupId = 3;
  const groupChatId = 40;
  const chatId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const query = "comédia leve";
  const groupMemberUserIds = [7, 12];

  const group: UserGroupEntity = {
    id: groupId,
    name: "Sábado cinema",
    ownerId: userId,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  const membership: GroupMemberEntity = {
    groupId,
    userId,
    joinedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  const mockRecommendation: MovieRecommendationEntity = {
    movies: [
      {
        title: "Se Beber, Não Case!",
        director: "Todd Phillips",
        actors: ["Bradley Cooper", "Ed Helms"],
        releaseYear: 2009,
        streamingPlatform: "Netflix",
        imdbRating: 7.7,
        synopsis: "Três amigos vão a Las Vegas para uma despedida de solteiro.",
        whySuggestion: "Comédia leve e divertida para assistir em grupo.",
        durationInMinutes: 100,
      },
    ],
    response: "Aqui vão algumas comédias leves para vocês!",
  };

  const touchedChat: GroupChatEntity = {
    id: groupChatId,
    groupId,
    chatId,
    title: "Filmes de ficção",
    filterMemberUserIds: [7, 12],
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-03T12:00:00.000Z"),
  };

  let userGroupRepository: IUserGroupRepository;
  let groupChatRepository: IGroupChatRepository;
  let getMovieRecommendationUseCase: GetMovieRecommendationUseCase;
  let createGetMovieRecommendationUseCase: CreateGetMovieRecommendationUseCase;
  let conversationTitleGenerator: ConversationTitleGenerator;
  let useCase: RecommendInGroupChatUseCase;

  const createMockGroupChat = (
    overrides?: Partial<GroupChatEntity>,
  ): GroupChatEntity => ({
    id: groupChatId,
    groupId,
    chatId,
    title: "Filmes de ficção",
    filterMemberUserIds: [7, 12],
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    userGroupRepository = {
      findById: vi.fn().mockResolvedValue(group),
      createWithOwner: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      listGroupsForUser: vi.fn(),
      findMembership: vi.fn().mockResolvedValue(membership),
      isOwner: vi.fn(),
      countMembers: vi.fn(),
      addMember: vi.fn(),
      removeMember: vi.fn(),
      transferOwnership: vi.fn(),
      findOldestMemberAfterOwner: vi.fn(),
      deleteGroupAndRelated: vi.fn(),
      findMemberUserIds: vi.fn().mockResolvedValue(groupMemberUserIds),
      findMemberProfiles: vi.fn(),
      leaveAsOwnerWithTransfer: vi.fn(),
    };

    groupChatRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByChatId: vi.fn().mockResolvedValue(createMockGroupChat()),
      listByGroupId: vi.fn(),
      updateTitle: vi.fn().mockResolvedValue(touchedChat),
      updateFilterMembers: vi.fn(),
      touchUpdatedAt: vi.fn().mockResolvedValue(touchedChat),
      deleteById: vi.fn(),
    };

    getMovieRecommendationUseCase = {
      execute: vi.fn().mockResolvedValue({
        movies: mockRecommendation.movies,
        response: mockRecommendation.response,
      }),
    } as unknown as GetMovieRecommendationUseCase;

    createGetMovieRecommendationUseCase = vi
      .fn()
      .mockReturnValue(getMovieRecommendationUseCase);

    conversationTitleGenerator = {
      generateFromUserMessage: vi.fn(),
    } as unknown as ConversationTitleGenerator;

    useCase = new RecommendInGroupChatUseCase(
      userGroupRepository,
      groupChatRepository,
      createGetMovieRecommendationUseCase,
      conversationTitleGenerator,
    );
  });

  it("REQ-5: membro obtém recomendação com excludeWatched e filterUserIds do chat", async () => {
    const result = await useCase.execute(userId, groupId, chatId, query);

    expect(userGroupRepository.findById).toHaveBeenCalledWith(groupId);
    expect(userGroupRepository.findMembership).toHaveBeenCalledWith(
      groupId,
      userId,
    );
    expect(groupChatRepository.findByChatId).toHaveBeenCalledWith(
      groupId,
      chatId,
    );
    expect(userGroupRepository.findMemberUserIds).toHaveBeenCalledWith(groupId);
    expect(groupChatRepository.touchUpdatedAt).toHaveBeenCalledWith(
      groupId,
      chatId,
    );
    expect(createGetMovieRecommendationUseCase).toHaveBeenCalledWith({
      userId,
      excludeWatched: true,
      filterUserIds: [7, 12],
    });
    expect(getMovieRecommendationUseCase.execute).toHaveBeenCalledWith(
      query,
      chatId,
      {
        userId,
        excludeWatched: true,
        filterUserIds: [7, 12],
      },
    );
    expect(result).toEqual({
      movies: mockRecommendation.movies,
      response: mockRecommendation.response,
    });
  });

  it("REQ-6: não-membro recebe NotGroupMemberException", async () => {
    vi.mocked(userGroupRepository.findMembership).mockResolvedValue(null);

    await expect(
      useCase.execute(99, groupId, chatId, query),
    ).rejects.toThrow(NotGroupMemberException);
    expect(groupChatRepository.findByChatId).not.toHaveBeenCalled();
    expect(getMovieRecommendationUseCase.execute).not.toHaveBeenCalled();
    expect(groupChatRepository.touchUpdatedAt).not.toHaveBeenCalled();
  });

  it("grupo inexistente lança UserGroupNotFoundException", async () => {
    vi.mocked(userGroupRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute(userId, 999, chatId, query),
    ).rejects.toThrow(UserGroupNotFoundException);
    expect(userGroupRepository.findMembership).not.toHaveBeenCalled();
    expect(groupChatRepository.findByChatId).not.toHaveBeenCalled();
    expect(getMovieRecommendationUseCase.execute).not.toHaveBeenCalled();
  });

  it("chat não encontrado no grupo lança GroupChatNotFoundException", async () => {
    vi.mocked(groupChatRepository.findByChatId).mockResolvedValue(null);

    await expect(
      useCase.execute(userId, groupId, chatId, query),
    ).rejects.toThrow(GroupChatNotFoundException);
    expect(getMovieRecommendationUseCase.execute).not.toHaveBeenCalled();
    expect(groupChatRepository.touchUpdatedAt).not.toHaveBeenCalled();
  });

  it("chat ausente no touch antes da recomendação lança GroupChatNotFoundException", async () => {
    vi.mocked(groupChatRepository.touchUpdatedAt).mockResolvedValue(null);

    await expect(
      useCase.execute(userId, groupId, chatId, query),
    ).rejects.toThrow(GroupChatNotFoundException);
    expect(getMovieRecommendationUseCase.execute).not.toHaveBeenCalled();
    expect(groupChatRepository.touchUpdatedAt).toHaveBeenCalledWith(
      groupId,
      chatId,
    );
  });

  it("REQ-9: chat sem título gera título e chama updateTitle após sucesso", async () => {
    const chatWithoutTitle = createMockGroupChat({ title: null });
    const generatedTitle = "Comédias leves";
    const titledChat = createMockGroupChat({ title: generatedTitle });

    vi.mocked(groupChatRepository.findByChatId).mockResolvedValue(
      chatWithoutTitle,
    );
    vi.mocked(
      conversationTitleGenerator.generateFromUserMessage,
    ).mockResolvedValue(generatedTitle);
    vi.mocked(groupChatRepository.updateTitle).mockResolvedValue(titledChat);

    const result = await useCase.execute(userId, groupId, chatId, query);

    expect(
      conversationTitleGenerator.generateFromUserMessage,
    ).toHaveBeenCalledWith(query);
    expect(groupChatRepository.updateTitle).toHaveBeenCalledWith(
      groupId,
      groupChatId,
      generatedTitle,
    );
    expect(result).toEqual({
      movies: mockRecommendation.movies,
      response: mockRecommendation.response,
    });
  });

  it("REQ-9: falha do gerador de título mantém title null e recommendation retorna", async () => {
    const chatWithoutTitle = createMockGroupChat({ title: null });

    vi.mocked(groupChatRepository.findByChatId).mockResolvedValue(
      chatWithoutTitle,
    );
    vi.mocked(
      conversationTitleGenerator.generateFromUserMessage,
    ).mockResolvedValue(null);

    const result = await useCase.execute(userId, groupId, chatId, query);

    expect(groupChatRepository.updateTitle).not.toHaveBeenCalled();
    expect(groupChatRepository.touchUpdatedAt).toHaveBeenCalledWith(
      groupId,
      chatId,
    );
    expect(result).toEqual({
      movies: mockRecommendation.movies,
      response: mockRecommendation.response,
    });
  });

  it("chat com título existente não chama gerador de título", async () => {
    await useCase.execute(userId, groupId, chatId, query);

    expect(
      conversationTitleGenerator.generateFromUserMessage,
    ).not.toHaveBeenCalled();
    expect(groupChatRepository.updateTitle).not.toHaveBeenCalled();
  });

  it("repassa filterMemberUserIds do chat para a recomendação", async () => {
    const customFilterIds = [7, 12, 15];
    const chatWithCustomFilter = createMockGroupChat({
      filterMemberUserIds: customFilterIds,
    });

    vi.mocked(groupChatRepository.findByChatId).mockResolvedValue(
      chatWithCustomFilter,
    );

    await useCase.execute(userId, groupId, chatId, query);

    expect(createGetMovieRecommendationUseCase).toHaveBeenCalledWith({
      userId,
      excludeWatched: true,
      filterUserIds: [7, 12],
    });
    expect(getMovieRecommendationUseCase.execute).toHaveBeenCalledWith(
      query,
      chatId,
      {
        userId,
        excludeWatched: true,
        filterUserIds: [7, 12],
      },
    );
  });

  it("intersecta filterMemberUserIds com membros atuais do grupo", async () => {
    const chatWithRemovedMember = createMockGroupChat({
      filterMemberUserIds: [7, 12, 99],
    });

    vi.mocked(groupChatRepository.findByChatId).mockResolvedValue(
      chatWithRemovedMember,
    );

    await useCase.execute(userId, groupId, chatId, query);

    expect(createGetMovieRecommendationUseCase).toHaveBeenCalledWith({
      userId,
      excludeWatched: true,
      filterUserIds: [7, 12],
    });
  });

  it("propaga erros do GetMovieRecommendationUseCase", async () => {
    const recommendationError = new Error("AI provider unavailable");
    vi.mocked(getMovieRecommendationUseCase.execute).mockRejectedValue(
      recommendationError,
    );

    await expect(
      useCase.execute(userId, groupId, chatId, query),
    ).rejects.toThrow(recommendationError);
    expect(groupChatRepository.touchUpdatedAt).toHaveBeenCalledWith(
      groupId,
      chatId,
    );
    expect(groupChatRepository.updateTitle).not.toHaveBeenCalled();
  });

  it("query vazia lança GroupChatValidationException", async () => {
    await expect(
      useCase.execute(userId, groupId, chatId, "   "),
    ).rejects.toThrow(GroupChatValidationException);
    expect(userGroupRepository.findById).not.toHaveBeenCalled();
  });

  it("REQ-8/C7: filterMemberUserIds vazio repassa filtro vazio sem modo exclude", async () => {
    const chatWithEmptyFilter = createMockGroupChat({
      filterMemberUserIds: [],
    });

    vi.mocked(groupChatRepository.findByChatId).mockResolvedValue(
      chatWithEmptyFilter,
    );

    await useCase.execute(userId, groupId, chatId, query);

    expect(createGetMovieRecommendationUseCase).toHaveBeenCalledWith({
      userId,
      excludeWatched: true,
      filterUserIds: [],
    });
    expect(getMovieRecommendationUseCase.execute).toHaveBeenCalledWith(
      query,
      chatId,
      {
        userId,
        excludeWatched: true,
        filterUserIds: [],
      },
    );
  });

  it("REQ-8/C8: touchUpdatedAt ocorre antes da recommendation (falha pós-sucesso é N/A)", async () => {
    const callOrder: string[] = [];

    vi.mocked(groupChatRepository.touchUpdatedAt).mockImplementation(
      async () => {
        callOrder.push("touchUpdatedAt");
        return touchedChat;
      },
    );
    vi.mocked(getMovieRecommendationUseCase.execute).mockImplementation(
      async () => {
        callOrder.push("recommendation");
        return {
          movies: mockRecommendation.movies,
          response: mockRecommendation.response,
        };
      },
    );

    await useCase.execute(userId, groupId, chatId, query);

    expect(callOrder).toEqual(["touchUpdatedAt", "recommendation"]);
  });
});
