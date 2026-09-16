import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import type { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import type { UserConversationEntity } from "@/domains/movies/domain/entities/user-conversation.entity";
import { UserConversationNotFoundException } from "@/domains/movies/domain/exceptions/user-conversation-not-found.exception";
import { UserConversationValidationException } from "@/domains/movies/domain/exceptions/user-conversation-validation.exception";
import { CreateUserConversationUseCase } from "@/domains/movies/application/use-cases/create-user-conversation.use-case";
import { DeleteUserConversationUseCase } from "@/domains/movies/application/use-cases/delete-user-conversation.use-case";
import { GetUserConversationUseCase } from "@/domains/movies/application/use-cases/get-user-conversation.use-case";
import { ListUserConversationsUseCase } from "@/domains/movies/application/use-cases/list-user-conversations.use-case";
import { UpdateUserConversationTitleUseCase } from "@/domains/movies/application/use-cases/update-user-conversation-title.use-case";
import type {
  UserConversationIdParams,
  UserConversationPatchDTO,
} from "../../dto/user-conversation.dto";
import { UserConversationController } from "../user-conversation.controller";

class UserConversationControllerFixtures {
  static conversation(
    overrides: Partial<UserConversationEntity> = {},
  ): UserConversationEntity {
    return {
      id: 12,
      userId: 42,
      chatId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      title: "Filmes de ficção",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-03T10:00:00.000Z"),
      ...overrides,
    };
  }

  static messages(): ChatHistoryEntity {
    return [
      ["user", "Quero filmes de ficção dos anos 90"],
      ["ai", "Recomendo Blade Runner e Matrix"],
    ];
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
): T & { userMovieEntryAuth: { userId: number } } {
  return {
    ...request,
    userMovieEntryAuth: { userId: 42 },
  };
}

describe("UserConversationController", () => {
  let createUserConversationUseCase: CreateUserConversationUseCase;
  let listUserConversationsUseCase: ListUserConversationsUseCase;
  let getUserConversationUseCase: GetUserConversationUseCase;
  let updateUserConversationTitleUseCase: UpdateUserConversationTitleUseCase;
  let deleteUserConversationUseCase: DeleteUserConversationUseCase;
  let handlers: ReturnType<typeof UserConversationController.create>;

  beforeEach(() => {
    vi.clearAllMocks();

    createUserConversationUseCase = {
      execute: vi.fn(),
    } as unknown as CreateUserConversationUseCase;
    listUserConversationsUseCase = {
      execute: vi.fn(),
    } as unknown as ListUserConversationsUseCase;
    getUserConversationUseCase = {
      execute: vi.fn(),
    } as unknown as GetUserConversationUseCase;
    updateUserConversationTitleUseCase = {
      execute: vi.fn(),
    } as unknown as UpdateUserConversationTitleUseCase;
    deleteUserConversationUseCase = {
      execute: vi.fn(),
    } as unknown as DeleteUserConversationUseCase;

    handlers = UserConversationController.create({
      createUserConversationUseCase,
      listUserConversationsUseCase,
      getUserConversationUseCase,
      updateUserConversationTitleUseCase,
      deleteUserConversationUseCase,
    });
  });

  it("create happy path returns 201 with conversation summary", async () => {
    const conversation = UserConversationControllerFixtures.conversation({
      title: null,
    });
    vi.mocked(createUserConversationUseCase.execute).mockResolvedValue(
      conversation,
    );
    const request = createAuthRequest({}) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.create(request, reply);

    expect(createUserConversationUseCase.execute).toHaveBeenCalledWith(42);
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({
      id: 12,
      chatId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      title: null,
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-03T10:00:00.000Z",
    });
  });

  it("list happy path returns 200 with conversation array", async () => {
    const conversation = UserConversationControllerFixtures.conversation();
    vi.mocked(listUserConversationsUseCase.execute).mockResolvedValue([
      conversation,
    ]);
    const request = createAuthRequest({}) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.list(request, reply);

    expect(listUserConversationsUseCase.execute).toHaveBeenCalledWith(42);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith([
      {
        id: 12,
        chatId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        title: "Filmes de ficção",
        createdAt: "2026-03-01T10:00:00.000Z",
        updatedAt: "2026-03-03T10:00:00.000Z",
      },
    ]);
  });

  it("getById happy path returns 200 with messages", async () => {
    const conversation = UserConversationControllerFixtures.conversation();
    const messages = UserConversationControllerFixtures.messages();
    vi.mocked(getUserConversationUseCase.execute).mockResolvedValue({
      conversation,
      messages,
    });
    const request = createAuthRequest({
      params: { id: "12" },
    }) as unknown as FastifyRequest<{ Params: UserConversationIdParams }>;
    const reply = createReply();

    await handlers.getById(request, reply);

    expect(getUserConversationUseCase.execute).toHaveBeenCalledWith(42, 12);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      id: 12,
      chatId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      title: "Filmes de ficção",
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-03T10:00:00.000Z",
      messages,
    });
  });

  it("getById propagates UserConversationNotFoundException", async () => {
    const notFoundError = new UserConversationNotFoundException(12);
    vi.mocked(getUserConversationUseCase.execute).mockRejectedValue(
      notFoundError,
    );
    const request = createAuthRequest({
      params: { id: "12" },
    }) as unknown as FastifyRequest<{ Params: UserConversationIdParams }>;
    const reply = createReply();

    await expect(handlers.getById(request, reply)).rejects.toThrow(
      UserConversationNotFoundException,
    );
  });

  it("patch happy path returns 200 with updated conversation", async () => {
    const conversation = UserConversationControllerFixtures.conversation({
      title: "Filmes de ficção dos anos 90",
    });
    vi.mocked(updateUserConversationTitleUseCase.execute).mockResolvedValue(
      conversation,
    );
    const request = createAuthRequest({
      params: { id: "12" },
      body: { title: "Filmes de ficção dos anos 90" },
    }) as unknown as FastifyRequest<{
      Params: UserConversationIdParams;
      Body: UserConversationPatchDTO;
    }>;
    const reply = createReply();

    await handlers.patch(request, reply);

    expect(updateUserConversationTitleUseCase.execute).toHaveBeenCalledWith(
      42,
      12,
      "Filmes de ficção dos anos 90",
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      id: 12,
      chatId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      title: "Filmes de ficção dos anos 90",
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-03T10:00:00.000Z",
    });
  });

  it("patch propagates UserConversationNotFoundException", async () => {
    const notFoundError = new UserConversationNotFoundException(12);
    vi.mocked(updateUserConversationTitleUseCase.execute).mockRejectedValue(
      notFoundError,
    );
    const request = createAuthRequest({
      params: { id: "12" },
      body: { title: "Novo título" },
    }) as unknown as FastifyRequest<{
      Params: UserConversationIdParams;
      Body: UserConversationPatchDTO;
    }>;
    const reply = createReply();

    await expect(handlers.patch(request, reply)).rejects.toThrow(
      UserConversationNotFoundException,
    );
  });

  it("delete happy path returns 204", async () => {
    vi.mocked(deleteUserConversationUseCase.execute).mockResolvedValue();
    const request = createAuthRequest({
      params: { id: "12" },
    }) as unknown as FastifyRequest<{ Params: UserConversationIdParams }>;
    const reply = createReply();

    await handlers.delete(request, reply);

    expect(deleteUserConversationUseCase.execute).toHaveBeenCalledWith(42, 12);
    expect(reply.status).toHaveBeenCalledWith(204);
    expect(reply.send).toHaveBeenCalledWith();
  });

  it("delete propagates UserConversationNotFoundException", async () => {
    const notFoundError = new UserConversationNotFoundException(12);
    vi.mocked(deleteUserConversationUseCase.execute).mockRejectedValue(
      notFoundError,
    );
    const request = createAuthRequest({
      params: { id: "12" },
    }) as unknown as FastifyRequest<{ Params: UserConversationIdParams }>;
    const reply = createReply();

    await expect(handlers.delete(request, reply)).rejects.toThrow(
      UserConversationNotFoundException,
    );
  });

  it("rejects invalid conversation id before calling use case", async () => {
    const request = createAuthRequest({
      params: { id: "0" },
    }) as unknown as FastifyRequest<{ Params: UserConversationIdParams }>;
    const reply = createReply();

    await expect(handlers.getById(request, reply)).rejects.toBeInstanceOf(
      UserConversationValidationException,
    );
    expect(getUserConversationUseCase.execute).not.toHaveBeenCalled();
  });

  it("throws validation exception when auth context is missing", async () => {
    const request = {} as FastifyRequest;
    const reply = createReply();

    await expect(handlers.create(request, reply)).rejects.toBeInstanceOf(
      UserConversationValidationException,
    );
    expect(createUserConversationUseCase.execute).not.toHaveBeenCalled();
  });

  it("uses userId from auth context instead of any client input", async () => {
    const conversation = UserConversationControllerFixtures.conversation();
    vi.mocked(createUserConversationUseCase.execute).mockResolvedValue(
      conversation,
    );
    const request = createAuthRequest({}) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.create(request, reply);

    const [calledUserId] = vi.mocked(createUserConversationUseCase.execute).mock
      .calls[0]!;

    expect(calledUserId).toBe(42);
  });
});
