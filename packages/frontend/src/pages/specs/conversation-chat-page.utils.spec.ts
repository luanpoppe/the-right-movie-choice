jest.mock("lucide-react", () => ({
  Send: () => null,
  RotateCcw: () => null,
}));

jest.mock("@/features/chat", () => ({
  Chat: () => null,
}));

jest.mock("@/features/conversations/components/conversation-sidebar", () => ({
  ConversationSidebar: () => null,
}));

jest.mock("@/features/conversations/hooks/use-conversation-chat", () => ({
  useConversationChat: jest.fn(),
}));

jest.mock("@/features/conversations/services/user-conversation.service", () => ({
  UserConversationService: {
    getById: jest.fn(),
  },
}));

jest.mock("@/features/movies/context/user-movie-entries.context", () => ({
  UserMovieEntriesProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

import axios from "axios";
import { ConversationChatPageUtils } from "../ConversationChatPage";

describe("ConversationChatPageUtils.isNotFoundError", () => {
  it("REQ-10: identifica erro 404 do axios como not found", () => {
    const error = new axios.AxiosError(
      "Not Found",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 404,
        statusText: "Not Found",
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
        data: {},
      },
    );

    expect(ConversationChatPageUtils.isNotFoundError(error)).toBe(true);
  });

  it("REQ-10: outros status axios não são tratados como not found", () => {
    const error = new axios.AxiosError(
      "Server Error",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
        data: {},
      },
    );

    expect(ConversationChatPageUtils.isNotFoundError(error)).toBe(false);
  });

  it("REQ-10: erro não-axios retorna false", () => {
    expect(ConversationChatPageUtils.isNotFoundError(new Error("generic"))).toBe(
      false,
    );
    expect(ConversationChatPageUtils.isNotFoundError(null)).toBe(false);
  });
});
