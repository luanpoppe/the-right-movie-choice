jest.mock("@/features/social/services/group-chats.service", () => ({
  GroupChatsService: {
    getByChatId: jest.fn(),
    recommend: jest.fn(),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

import axios from "axios";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import toast from "react-hot-toast";
import { GROUP_CHAT_POLLING_INTERVAL_MS } from "@/features/social/constants/group-chat-polling.constants";
import type { ChatEntity } from "@/features/chat/entities/chat.entity";
import type { GroupChatGetResponse, GroupChatRecommendationResponse } from "@/features/social/dto/group-chats.dto";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { useGroupChat } from "../use-group-chat";

const EMPTY_MESSAGES: ChatEntity = [];

const mockedGetByChatId = jest.mocked(GroupChatsService.getByChatId);
const mockedRecommend = jest.mocked(GroupChatsService.recommend);
const mockedToastError = jest.mocked(toast.error);

const CHAT_ID = "550e8400-e29b-41d4-a716-446655440000";
const GROUP_ID = 3;

class UseGroupChatFixtures {
  static chatResponse(
    overrides: Partial<GroupChatGetResponse> = {},
  ): GroupChatGetResponse {
    return {
      id: 40,
      groupId: GROUP_ID,
      chatId: CHAT_ID,
      title: null,
      filterMemberUserIds: [7, 12, 15],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      messages: [
        ["user", "olá"],
        ["ai", "Olá! Como posso ajudar?"],
      ],
      ...overrides,
    };
  }

  static recommendationResponse(): GroupChatRecommendationResponse {
    return {
      movies: [
        {
          title: "The Grand Budapest Hotel",
          director: "Wes Anderson",
          actors: ["Ralph Fiennes", "Tony Revolori"],
          releaseYear: 2014,
          streamingPlatform: "Disney+",
          imdbRating: 8.1,
          synopsis: "A concierge and his protégé become embroiled in a murder mystery.",
          whySuggestion: "Comedy leve com visual distintivo.",
          durationInMinutes: 99,
          tmdbId: 120467,
          posterPath: "/poster.jpg",
        },
      ],
      response: "Aqui estão algumas comédias leves.",
    };
  }
}

function GroupChatHookHarness({
  groupId,
  chatId,
  enabled = false,
}: {
  groupId: number;
  chatId: string;
  enabled?: boolean;
}) {
  const { messages, handleSubmit, isLoading } = useGroupChat({
    groupId,
    chatId,
    initialMessages: EMPTY_MESSAGES,
    enabled,
  });

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="message" aria-label="Message" />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
      <ul>
        {messages.map((message, index) => (
          <li key={index}>{message.message}</li>
        ))}
      </ul>
    </div>
  );
}

describe("useGroupChat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetByChatId.mockResolvedValue(UseGroupChatFixtures.chatResponse());
    mockedRecommend.mockResolvedValue(
      UseGroupChatFixtures.recommendationResponse(),
    );
  });

  it("REQ-5: faz polling a cada 5000 ms enquanto enabled", async () => {
    jest.useFakeTimers();

    renderHook(() =>
      useGroupChat({
        groupId: GROUP_ID,
        chatId: CHAT_ID,
        enabled: true,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(GROUP_CHAT_POLLING_INTERVAL_MS);
    });

    expect(mockedGetByChatId).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(GROUP_CHAT_POLLING_INTERVAL_MS);
    });

    expect(mockedGetByChatId).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  function patchFormMessageField(
    form: HTMLFormElement,
    messageInput: HTMLInputElement,
  ) {
    Object.defineProperty(form, "message", {
      get: () => messageInput,
      configurable: true,
    });
  }

  async function submitHarnessMessage(message: string) {
    render(
      <GroupChatHookHarness groupId={GROUP_ID} chatId={CHAT_ID} enabled={false} />,
    );

    const messageInput = screen.getByLabelText("Message") as HTMLInputElement;
    messageInput.value = message;

    const form = messageInput.closest("form");
    if (!form) {
      throw new Error("Form not found");
    }

    patchFormMessageField(form, messageInput);

    await act(async () => {
      fireEvent.submit(form);
      await Promise.resolve();
    });
  }

  it("REQ-4: envia recomendação e exibe resposta da IA com filmes", async () => {
    mockedGetByChatId.mockResolvedValue(
      UseGroupChatFixtures.chatResponse({
        messages: [
          ["user", "comédia leve"],
          ["ai", "Aqui estão algumas comédias leves."],
        ],
      }),
    );

    await submitHarnessMessage("comédia leve");

    await waitFor(() => {
      expect(mockedRecommend).toHaveBeenCalledWith(
        GROUP_ID,
        CHAT_ID,
        "comédia leve",
      );
    });

    expect(
      await screen.findByText("Aqui estão algumas comédias leves."),
    ).toBeInTheDocument();
  });

  it("REQ-5: refetch imediato após recomendação bem-sucedida", async () => {
    mockedGetByChatId.mockClear();

    await submitHarnessMessage("comédia leve");

    await waitFor(() => {
      expect(mockedGetByChatId).toHaveBeenCalledWith(GROUP_ID, CHAT_ID);
    });
  });

  it("REQ-5: falha de polling mostra toast e mantém histórico válido", async () => {
    jest.useFakeTimers();

    const initialMessages: ChatEntity = [
      { from: "user", message: "mensagem anterior" },
    ];

    const { result } = renderHook(
      (props: { messages: ChatEntity }) =>
        useGroupChat({
          groupId: GROUP_ID,
          chatId: CHAT_ID,
          initialMessages: props.messages,
          enabled: true,
        }),
      { initialProps: { messages: initialMessages } },
    );

    mockedGetByChatId.mockRejectedValue(new Error("network"));

    await act(async () => {
      jest.advanceTimersByTime(GROUP_CHAT_POLLING_INTERVAL_MS);
      await Promise.resolve();
    });

    expect(mockedToastError).toHaveBeenCalledWith(
      "Unexpected Error. Try again or get in contact with the staff.",
    );
    expect(result.current.messages).toEqual(initialMessages);

    jest.useRealTimers();
  });

  it("edge: mensagem vazia não chama recommend", async () => {
    await submitHarnessMessage("   ");

    expect(mockedRecommend).not.toHaveBeenCalled();
  });

  it("edge: falha na recomendação remove mensagem do usuário e mostra toast", async () => {
    mockedRecommend.mockRejectedValue(new Error("server error"));

    await submitHarnessMessage("comédia leve");

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Unexpected Error. Try again or get in contact with the staff.",
      );
    });

    expect(screen.queryByText("comédia leve")).not.toBeInTheDocument();
  });

  it("REQ-8: polling 404 chama onChatNotFound sem toast", async () => {
    jest.useFakeTimers();

    const onChatNotFound = jest.fn();
    const axiosError = new axios.AxiosError("not found");
    axiosError.response = {
      status: 404,
      data: {},
      headers: {},
      statusText: "404",
      config: {} as never,
    };
    mockedGetByChatId.mockRejectedValue(axiosError);

    renderHook(() =>
      useGroupChat({
        groupId: GROUP_ID,
        chatId: CHAT_ID,
        enabled: true,
        onChatNotFound,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(GROUP_CHAT_POLLING_INTERVAL_MS);
      await Promise.resolve();
    });

    expect(onChatNotFound).toHaveBeenCalledTimes(1);
    expect(mockedToastError).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("edge: atualizar initialMessages após seed não reseta histórico", async () => {
    const initialMessages: ChatEntity = [
      { from: "user", message: "mensagem preservada" },
    ];

    const { result, rerender } = renderHook(
      (props: { messages: ChatEntity }) =>
        useGroupChat({
          groupId: GROUP_ID,
          chatId: CHAT_ID,
          initialMessages: props.messages,
          enabled: false,
        }),
      { initialProps: { messages: initialMessages } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    result.current.setMessages([
      { from: "user", message: "mensagem preservada" },
      { from: "ai", message: "resposta local" },
    ]);

    rerender({ messages: [...initialMessages] });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.messages).toEqual([
      { from: "user", message: "mensagem preservada" },
      { from: "ai", message: "resposta local" },
    ]);
  });

  it("edge: troca de chat ignora resposta obsoleta do fetch", async () => {
    let resolveFirstFetch: (value: GroupChatGetResponse) => void = () => {};
    const firstFetchPromise = new Promise<GroupChatGetResponse>((resolve) => {
      resolveFirstFetch = resolve;
    });

    mockedGetByChatId
      .mockReturnValueOnce(firstFetchPromise)
      .mockResolvedValue(
        UseGroupChatFixtures.chatResponse({
          chatId: "660e8400-e29b-41d4-a716-446655440001",
          messages: [["user", "novo chat"]],
        }),
      );

    const { result, rerender } = renderHook(
      (props: { groupId: number; chatId: string }) =>
        useGroupChat({
          groupId: props.groupId,
          chatId: props.chatId,
          enabled: false,
        }),
      {
        initialProps: { groupId: GROUP_ID, chatId: CHAT_ID },
      },
    );

    await act(async () => {
      void result.current.refetch();
    });

    rerender({
      groupId: GROUP_ID,
      chatId: "660e8400-e29b-41d4-a716-446655440001",
    });

    await act(async () => {
      await result.current.refetch();
    });

    await act(async () => {
      resolveFirstFetch(UseGroupChatFixtures.chatResponse());
      await Promise.resolve();
    });

    expect(mockedGetByChatId).toHaveBeenCalledTimes(2);
  });
});
