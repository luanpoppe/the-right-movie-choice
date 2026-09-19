import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import type { IMovieCatalogRepository } from "@/domains/movies/domain/repositories/movie-catalog.repository";
import { MovieRecommendationResponseMapper } from "@/domains/movies/infrastructure/http/mappers/movie-recommendation-response.mapper";
import type { GetGroupChatResult } from "@/modules/social/application/use-cases/get-group-chat.use-case";
import { CreateGroupChatUseCase } from "@/modules/social/application/use-cases/create-group-chat.use-case";
import { DeleteGroupChatUseCase } from "@/modules/social/application/use-cases/delete-group-chat.use-case";
import { GetGroupChatUseCase } from "@/modules/social/application/use-cases/get-group-chat.use-case";
import { ListGroupChatsUseCase } from "@/modules/social/application/use-cases/list-group-chats.use-case";
import { RecommendInGroupChatUseCase } from "@/modules/social/application/use-cases/recommend-in-group-chat.use-case";
import { UpdateGroupChatFilterMembersUseCase } from "@/modules/social/application/use-cases/update-group-chat-filter-members.use-case";
import { UpdateGroupChatTitleUseCase } from "@/modules/social/application/use-cases/update-group-chat-title.use-case";
import type { GroupChatEntity } from "@/modules/social/domain/entities/group-chat.entity";
import { GroupChatInvalidFilterMemberUserIdsException } from "@/modules/social/domain/exceptions/group-chat-invalid-filter-member-user-ids.exception";
import { GroupChatNotFoundException } from "@/modules/social/domain/exceptions/group-chat-not-found.exception";
import { GroupChatValidationException } from "@/modules/social/domain/exceptions/group-chat-validation.exception";
import { NotGroupMemberException } from "@/modules/social/domain/exceptions/not-group-member.exception";
import type {
  CreateGroupChatDTO,
  GroupChatChatIdParams,
  GroupChatGroupIdParams,
  GroupChatNumericIdParams,
  GroupChatRecommendationRequestDTO,
  UpdateGroupChatFilterMembersDTO,
  UpdateGroupChatTitleDTO,
} from "../../dto/group-chats.dto";
import { GroupChatsController } from "../group-chats.controller";

class GroupChatsControllerFixtures {
  static groupChat(overrides: Partial<GroupChatEntity> = {}): GroupChatEntity {
    return {
      id: 40,
      groupId: 3,
      chatId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Sábado",
      filterMemberUserIds: [7, 12, 15],
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-01T10:00:00.000Z"),
      ...overrides,
    };
  }
}

function createReply(): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

function createAuthRequest<T extends Record<string, unknown>>(
  request: T,
  userId = 7,
): T & { userMovieEntryAuth: { userId: number } } {
  return {
    ...request,
    userMovieEntryAuth: { userId },
  };
}

describe("GroupChatsController", () => {
  let createGroupChatUseCase: CreateGroupChatUseCase;
  let listGroupChatsUseCase: ListGroupChatsUseCase;
  let getGroupChatUseCase: GetGroupChatUseCase;
  let updateGroupChatTitleUseCase: UpdateGroupChatTitleUseCase;
  let deleteGroupChatUseCase: DeleteGroupChatUseCase;
  let updateGroupChatFilterMembersUseCase: UpdateGroupChatFilterMembersUseCase;
  let recommendInGroupChatUseCase: RecommendInGroupChatUseCase;
  let catalogRepository: IMovieCatalogRepository;
  let handlers: ReturnType<typeof GroupChatsController.create>;

  beforeEach(() => {
    vi.clearAllMocks();

    createGroupChatUseCase = {
      execute: vi.fn(),
    } as unknown as CreateGroupChatUseCase;
    listGroupChatsUseCase = {
      execute: vi.fn(),
    } as unknown as ListGroupChatsUseCase;
    getGroupChatUseCase = {
      execute: vi.fn(),
    } as unknown as GetGroupChatUseCase;
    updateGroupChatTitleUseCase = {
      execute: vi.fn(),
    } as unknown as UpdateGroupChatTitleUseCase;
    deleteGroupChatUseCase = {
      execute: vi.fn(),
    } as unknown as DeleteGroupChatUseCase;
    updateGroupChatFilterMembersUseCase = {
      execute: vi.fn(),
    } as unknown as UpdateGroupChatFilterMembersUseCase;
    recommendInGroupChatUseCase = {
      execute: vi.fn(),
    } as unknown as RecommendInGroupChatUseCase;
    catalogRepository = {
      findByTmdbId: vi.fn(),
    } as unknown as IMovieCatalogRepository;

    handlers = GroupChatsController.create({
      createGroupChatUseCase,
      listGroupChatsUseCase,
      getGroupChatUseCase,
      updateGroupChatTitleUseCase,
      deleteGroupChatUseCase,
      updateGroupChatFilterMembersUseCase,
      recommendInGroupChatUseCase,
      catalogRepository,
    });
  });

  it("createGroupChat happy path returns 201", async () => {
    const chat = GroupChatsControllerFixtures.groupChat({ title: null });
    vi.mocked(createGroupChatUseCase.execute).mockResolvedValue(chat);
    const request = createAuthRequest({
      params: { groupId: "3" },
      body: {},
    }) as unknown as FastifyRequest<{
      Params: GroupChatGroupIdParams;
      Body: CreateGroupChatDTO;
    }>;
    const reply = createReply();

    await handlers.createGroupChat(request, reply);

    expect(createGroupChatUseCase.execute).toHaveBeenCalledWith(7, 3, undefined);
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 40,
        groupId: 3,
        chatId: "550e8400-e29b-41d4-a716-446655440000",
        filterMemberUserIds: [7, 12, 15],
      }),
    );
  });

  it("listGroupChats happy path returns 200", async () => {
    const chats = [GroupChatsControllerFixtures.groupChat()];
    vi.mocked(listGroupChatsUseCase.execute).mockResolvedValue(chats);
    const request = createAuthRequest({
      params: { groupId: "3" },
    }) as unknown as FastifyRequest<{ Params: GroupChatGroupIdParams }>;
    const reply = createReply();

    await handlers.listGroupChats(request, reply);

    expect(listGroupChatsUseCase.execute).toHaveBeenCalledWith(7, 3);
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  it("getGroupChat happy path returns 200 with messages", async () => {
    const chat = GroupChatsControllerFixtures.groupChat();
    const result: GetGroupChatResult = {
      chat,
      messages: [],
    };
    vi.mocked(getGroupChatUseCase.execute).mockResolvedValue(result);
    const request = createAuthRequest({
      params: { groupId: "3", chatId: "550e8400-e29b-41d4-a716-446655440000" },
    }) as unknown as FastifyRequest<{ Params: GroupChatChatIdParams }>;
    const reply = createReply();

    await handlers.getGroupChat(request, reply);

    expect(getGroupChatUseCase.execute).toHaveBeenCalledWith(
      7,
      3,
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: "550e8400-e29b-41d4-a716-446655440000",
        messages: [],
      }),
    );
  });

  it("updateGroupChatTitle happy path returns 200", async () => {
    const chat = GroupChatsControllerFixtures.groupChat({
      title: "Terror leve",
    });
    vi.mocked(updateGroupChatTitleUseCase.execute).mockResolvedValue(chat);
    const request = createAuthRequest({
      params: { groupId: "3", id: "40" },
      body: { title: "Terror leve" },
    }) as unknown as FastifyRequest<{
      Params: GroupChatNumericIdParams;
      Body: UpdateGroupChatTitleDTO;
    }>;
    const reply = createReply();

    await handlers.updateGroupChatTitle(request, reply);

    expect(updateGroupChatTitleUseCase.execute).toHaveBeenCalledWith(
      7,
      3,
      40,
      "Terror leve",
    );
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  it("deleteGroupChat happy path returns 204", async () => {
    vi.mocked(deleteGroupChatUseCase.execute).mockResolvedValue();
    const request = createAuthRequest({
      params: { groupId: "3", id: "40" },
    }) as unknown as FastifyRequest<{ Params: GroupChatNumericIdParams }>;
    const reply = createReply();

    await handlers.deleteGroupChat(request, reply);

    expect(deleteGroupChatUseCase.execute).toHaveBeenCalledWith(7, 3, 40);
    expect(reply.status).toHaveBeenCalledWith(204);
  });

  it("updateGroupChatFilterMembers happy path returns 200", async () => {
    const chat = GroupChatsControllerFixtures.groupChat({
      filterMemberUserIds: [7, 12],
    });
    vi.mocked(updateGroupChatFilterMembersUseCase.execute).mockResolvedValue(
      chat,
    );
    const request = createAuthRequest({
      params: { groupId: "3", id: "40" },
      body: { userIds: [7, 12] },
    }) as unknown as FastifyRequest<{
      Params: GroupChatNumericIdParams;
      Body: UpdateGroupChatFilterMembersDTO;
    }>;
    const reply = createReply();

    await handlers.updateGroupChatFilterMembers(request, reply);

    expect(updateGroupChatFilterMembersUseCase.execute).toHaveBeenCalledWith(
      7,
      3,
      40,
      [7, 12],
    );
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  it("updateGroupChatFilterMembers returns 400 with invalidUserIds instead of rethrowing", async () => {
    const invalidException = new GroupChatInvalidFilterMemberUserIdsException([
      99,
    ]);
    vi.mocked(updateGroupChatFilterMembersUseCase.execute).mockRejectedValue(
      invalidException,
    );
    const request = createAuthRequest({
      params: { groupId: "3", id: "40" },
      body: { userIds: [7, 99] },
    }) as unknown as FastifyRequest<{
      Params: GroupChatNumericIdParams;
      Body: UpdateGroupChatFilterMembersDTO;
    }>;
    const reply = createReply();

    await handlers.updateGroupChatFilterMembers(request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      error: invalidException.message,
      invalidUserIds: [99],
    });
  });

  it("recommendInGroupChat happy path returns 200 with mapped response", async () => {
    vi.mocked(recommendInGroupChatUseCase.execute).mockResolvedValue({
      movies: [],
      response: "Aqui vão sugestões",
    });
    const mapperSpy = vi
      .spyOn(MovieRecommendationResponseMapper.prototype, "toResponse")
      .mockResolvedValue({
        response: "Aqui vão sugestões",
        movies: [],
      });
    const request = createAuthRequest({
      params: { groupId: "3", chatId: "550e8400-e29b-41d4-a716-446655440000" },
      body: { query: "comédia leve" },
    }) as unknown as FastifyRequest<{
      Params: GroupChatChatIdParams;
      Body: GroupChatRecommendationRequestDTO;
    }>;
    const reply = createReply();

    await handlers.recommendInGroupChat(request, reply);

    expect(recommendInGroupChatUseCase.execute).toHaveBeenCalledWith(
      7,
      3,
      "550e8400-e29b-41d4-a716-446655440000",
      "comédia leve",
    );
    expect(mapperSpy).toHaveBeenCalledWith([], "Aqui vão sugestões");
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      response: "Aqui vão sugestões",
      movies: [],
    });
    mapperSpy.mockRestore();
  });

  it("rejects missing auth with GroupChatValidationException", async () => {
    const request = {
      params: { groupId: "3" },
    } as unknown as FastifyRequest<{ Params: GroupChatGroupIdParams }>;
    const reply = createReply();

    await expect(handlers.listGroupChats(request, reply)).rejects.toBeInstanceOf(
      GroupChatValidationException,
    );
    expect(listGroupChatsUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects invalid groupId before use case", async () => {
    const request = createAuthRequest({
      params: { groupId: "0" },
    }) as unknown as FastifyRequest<{ Params: GroupChatGroupIdParams }>;
    const reply = createReply();

    await expect(handlers.listGroupChats(request, reply)).rejects.toBeInstanceOf(
      GroupChatValidationException,
    );
    expect(listGroupChatsUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects empty recommendation query before use case", async () => {
    const request = createAuthRequest({
      params: { groupId: "3", chatId: "550e8400-e29b-41d4-a716-446655440000" },
      body: { query: "   " },
    }) as unknown as FastifyRequest<{
      Params: GroupChatChatIdParams;
      Body: GroupChatRecommendationRequestDTO;
    }>;
    const reply = createReply();

    await expect(
      handlers.recommendInGroupChat(request, reply),
    ).rejects.toBeInstanceOf(GroupChatValidationException);
    expect(recommendInGroupChatUseCase.execute).not.toHaveBeenCalled();
  });

  it("propagates NotGroupMemberException from use case", async () => {
    vi.mocked(listGroupChatsUseCase.execute).mockRejectedValue(
      new NotGroupMemberException(3),
    );
    const request = createAuthRequest({
      params: { groupId: "3" },
    }) as unknown as FastifyRequest<{ Params: GroupChatGroupIdParams }>;
    const reply = createReply();

    await expect(handlers.listGroupChats(request, reply)).rejects.toBeInstanceOf(
      NotGroupMemberException,
    );
  });

  it("propagates GroupChatNotFoundException from use case", async () => {
    vi.mocked(getGroupChatUseCase.execute).mockRejectedValue(
      new GroupChatNotFoundException(0),
    );
    const request = createAuthRequest({
      params: { groupId: "3", chatId: "550e8400-e29b-41d4-a716-446655440000" },
    }) as unknown as FastifyRequest<{ Params: GroupChatChatIdParams }>;
    const reply = createReply();

    await expect(handlers.getGroupChat(request, reply)).rejects.toBeInstanceOf(
      GroupChatNotFoundException,
    );
  });
});
