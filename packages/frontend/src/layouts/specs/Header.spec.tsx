import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Header } from "../Header";

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/auth/services/auth.service", () => ({
  AuthService: {
    logout: jest.fn(),
  },
}));

jest.mock("@/components/theme-toggle", () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockedUseAuth = jest.mocked(useAuth);

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("REQ-2: usuário autenticado vê link Conversations para /conversations", () => {
    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderHeader();

    const conversationsLink = screen.getByRole("link", { name: "Conversations" });
    expect(conversationsLink).toHaveAttribute("href", "/conversations");
  });

  it("REQ-11: usuário autenticado vê link Social para /social", () => {
    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderHeader();

    const socialLink = screen.getByRole("link", { name: "Social" });
    expect(socialLink).toHaveAttribute("href", "/social");
  });

  it("REQ-7: usuário autenticado vê link Meus filmes para /my-movies", () => {
    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderHeader();

    const myMoviesLink = screen.getByRole("link", { name: "My movies" });
    expect(myMoviesLink).toHaveAttribute("href", "/my-movies");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("REQ-2: visitante não vê link Conversations", () => {
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderHeader();

    expect(
      screen.queryByRole("link", { name: "Conversations" }),
    ).not.toBeInTheDocument();
  });

  it("REQ-11: visitante não vê link Social", () => {
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderHeader();

    expect(
      screen.queryByRole("link", { name: "Social" }),
    ).not.toBeInTheDocument();
  });

  it("REQ-7: visitante não vê link Meus filmes", () => {
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderHeader();

    expect(
      screen.queryByRole("link", { name: "My movies" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });
});
