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

  it("REQ-7: usuário autenticado vê link Meus filmes para /my-movies", () => {
    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderHeader();

    const myMoviesLink = screen.getByRole("link", { name: "Meus filmes" });
    expect(myMoviesLink).toHaveAttribute("href", "/my-movies");
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("REQ-7: visitante não vê link Meus filmes", () => {
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderHeader();

    expect(
      screen.queryByRole("link", { name: "Meus filmes" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar" })).toBeInTheDocument();
  });
});
