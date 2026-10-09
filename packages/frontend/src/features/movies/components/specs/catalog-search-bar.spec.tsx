jest.mock("lucide-react", () => ({
  Search: () => <span data-testid="icon-search" />,
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogSearchBar } from "../catalog-search-bar";

function renderBar(
  overrides: Partial<{
    value: string;
    onSearch: (text: string) => void;
    language: "en-US" | "pt-BR";
    onLanguageChange: (language: "en-US" | "pt-BR") => void;
  }> = {},
) {
  const onSearch = overrides.onSearch ?? jest.fn();
  const onLanguageChange = overrides.onLanguageChange ?? jest.fn();

  render(
    <CatalogSearchBar
      value={overrides.value ?? ""}
      onSearch={onSearch}
      language={overrides.language ?? "en-US"}
      onLanguageChange={onLanguageChange}
    />,
  );

  return { onSearch, onLanguageChange };
}

describe("CatalogSearchBar", () => {
  it("REQ-2: apertar Enter envia o texto digitado", async () => {
    const user = userEvent.setup();
    const { onSearch } = renderBar();

    const input = screen.getByPlaceholderText("Search movies by title");
    await user.type(input, "Interstellar{Enter}");

    expect(onSearch).toHaveBeenCalledWith("Interstellar");
  });

  it("REQ-2: clicar em Buscar envia o texto digitado", async () => {
    const user = userEvent.setup();
    const { onSearch } = renderBar();

    const input = screen.getByPlaceholderText("Search movies by title");
    await user.type(input, "Interstellar");
    await user.click(screen.getByRole("button", { name: /buscar/i }));

    expect(onSearch).toHaveBeenCalledWith("Interstellar");
  });

  it("edge: enviar vazio ainda delega o texto para onSearch", async () => {
    const user = userEvent.setup();
    const { onSearch } = renderBar();

    await user.click(screen.getByRole("button", { name: /buscar/i }));

    expect(onSearch).toHaveBeenCalledWith("");
  });

  it("REQ-6: clicar em PT propaga a troca de idioma", async () => {
    const user = userEvent.setup();
    const { onLanguageChange } = renderBar({ language: "en-US" });

    await user.click(screen.getByRole("button", { name: "PT" }));

    expect(onLanguageChange).toHaveBeenCalledWith("pt-BR");
  });

  it("REQ-6: idioma ativo tem aria-pressed true", () => {
    renderBar({ language: "pt-BR" });

    expect(screen.getByRole("button", { name: "PT" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("edge: sincroniza o input quando a prop value muda", () => {
    const { rerender } = render(
      <CatalogSearchBar
        value=""
        onSearch={jest.fn()}
        language="en-US"
        onLanguageChange={jest.fn()}
      />,
    );

    rerender(
      <CatalogSearchBar
        value="Interstellar"
        onSearch={jest.fn()}
        language="en-US"
        onLanguageChange={jest.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("Search movies by title")).toHaveValue(
      "Interstellar",
    );
  });
});
