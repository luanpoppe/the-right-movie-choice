jest.mock("../../services/friendship.service", () => ({
  FriendshipService: {
    sendFriendRequest: jest.fn(),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { FriendshipService } from "../../services/friendship.service";
import {
  AddFriendForm,
  AddFriendFormUtils,
} from "../add-friend-form";

const mockedSendFriendRequest = jest.mocked(
  FriendshipService.sendFriendRequest,
);
const mockedToastError = jest.mocked(toast.error);
const mockedToastSuccess = jest.mocked(toast.success);

function createAxiosError(status: number, errorMessage?: string): Error {
  const axiosError = new axios.AxiosError("request failed");
  axiosError.response = {
    status,
    data: errorMessage ? { error: errorMessage } : {},
    headers: {},
    statusText: String(status),
    config: {} as never,
  };
  return axiosError;
}

describe("AddFriendFormUtils.getSendFriendRequestErrorMessage", () => {
  it.each([
    {
      label: "409 com mensagem da API",
      error: createAxiosError(409, "Friend request already pending."),
      expected: "Friend request already pending.",
    },
    {
      label: "409 sem mensagem da API",
      error: createAxiosError(409),
      expected:
        "Unexpected Error. Try again or get in contact with the staff.",
    },
    {
      label: "500 genérico",
      error: createAxiosError(500),
      expected:
        "Unexpected Error. Try again or get in contact with the staff.",
    },
    {
      label: "erro não-Axios",
      error: new Error("network"),
      expected:
        "Unexpected Error. Try again or get in contact with the staff.",
    },
  ])("edge 409: $label", ({ error, expected }) => {
    const message = AddFriendFormUtils.getSendFriendRequestErrorMessage(error);

    expect(message).toBe(expected);
  });
});

describe("AddFriendForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSendFriendRequest.mockResolvedValue({
      id: 1,
      requesterId: 1,
      addresseeId: 2,
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("REQ-4: exibe toast de sucesso após envio", async () => {
    const user = userEvent.setup();

    render(<AddFriendForm />);

    await user.type(
      screen.getByLabelText("Add friend by email"),
      "maria@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send request" }));

    await waitFor(() => {
      expect(mockedSendFriendRequest).toHaveBeenCalledWith("maria@example.com");
    });

    expect(mockedToastSuccess).toHaveBeenCalledWith("Friend request sent.");
  });

  it("edge 409: exibe mensagem derivada do status no toast de erro", async () => {
    const user = userEvent.setup();
    const conflictError = createAxiosError(
      409,
      "You are already friends with this user.",
    );
    mockedSendFriendRequest.mockRejectedValue(conflictError);

    render(<AddFriendForm />);

    await user.type(
      screen.getByLabelText("Add friend by email"),
      "maria@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send request" }));

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "You are already friends with this user.",
      );
    });
  });

  it("REQ-12: exibe toast genérico quando envio falha", async () => {
    const user = userEvent.setup();
    mockedSendFriendRequest.mockRejectedValue(new Error("network"));

    render(<AddFriendForm />);

    await user.type(
      screen.getByLabelText("Add friend by email"),
      "maria@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send request" }));

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Unexpected Error. Try again or get in contact with the staff.",
      );
    });
  });
});
