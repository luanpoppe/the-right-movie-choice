jest.mock("lucide-react", () => ({
  Send: () => null,
  RotateCcw: () => null,
}));

jest.mock("@/features/chat", () => ({
  Chat: () => null,
}));

jest.mock("@/features/social/components/group-chat-sidebar", () => ({
  GroupChatSidebar: () => null,
}));

jest.mock("@/features/social/components/group-chat-filter-members-dialog", () => ({
  GroupChatFilterMembersDialog: () => null,
}));

jest.mock("@/features/social/hooks/use-group-chat", () => ({
  useGroupChat: jest.fn(),
}));

jest.mock("@/features/social/services/group-chats.service", () => ({
  GroupChatsService: {
    getByChatId: jest.fn(),
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
import { GroupChatPageUtils } from "../GroupChatPage";

describe("GroupChatPageUtils.isNotFoundError", () => {
  it("REQ-8: identifica erro 404 do axios como not found", () => {
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

    expect(GroupChatPageUtils.isNotFoundError(error)).toBe(true);
  });

  it("REQ-8: outros status axios não são tratados como not found", () => {
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

    expect(GroupChatPageUtils.isNotFoundError(error)).toBe(false);
  });

  it("REQ-8: erro não-axios retorna false", () => {
    expect(GroupChatPageUtils.isNotFoundError(new Error("generic"))).toBe(false);
    expect(GroupChatPageUtils.isNotFoundError(null)).toBe(false);
  });
});
