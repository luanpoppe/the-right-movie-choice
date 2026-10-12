jest.mock("../../services/movie-catalog-search.service", () => ({
  MovieCatalogSearchService: {
    searchPeople: jest.fn(),
    searchKeywords: jest.fn(),
  },
}));

jest.mock("lucide-react", () => ({
  X: () => <span data-testid="icon-x" />,
}));

import { act, fireEvent, render, screen } from "@testing-library/react";
import { MovieCatalogSearchService } from "../../services/movie-catalog-search.service";
import { CandidateSearchCombobox } from "../candidate-search-combobox";

const mockedSearchPeople = jest.mocked(
  MovieCatalogSearchService.searchPeople,
);
const mockedSearchKeywords = jest.mocked(
  MovieCatalogSearchService.searchKeywords,
);

const DEBOUNCE_MS = 300;

function personPage(
  results: Array<{
    id: number;
    name: string;
    knownForDepartment: string | null;
    knownFor: Array<{ id: number; title: string }>;
  }>,
) {
  return { page: 1, results };
}

function renderCombobox(
  overrides: Partial<{
    kind: "person" | "keyword";
    value: number[];
    onChange: (ids: number[]) => void;
    selectedLabels: Record<number, string>;
  }> = {},
) {
  const onChange = overrides.onChange ?? jest.fn();

  const view = render(
    <CandidateSearchCombobox
      kind={overrides.kind ?? "person"}
      label="Diretor"
      value={overrides.value ?? []}
      onChange={onChange}
      selectedLabels={overrides.selectedLabels}
    />,
  );

  return { onChange, ...view };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

type PersonPage = ReturnType<typeof personPage>;

async function typeTerm(term: string) {
  const input = screen.getByLabelText("Diretor");
  fireEvent.change(input, { target: { value: term } });

  await act(async () => {
    jest.advanceTimersByTime(DEBOUNCE_MS);
  });
}

describe("CandidateSearchCombobox", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    window.sessionStorage.clear();
    mockedSearchPeople.mockResolvedValue(
      personPage([
        {
          id: 525,
          name: "Christopher Nolan",
          knownForDepartment: "Directing",
          knownFor: [{ id: 27205, title: "Inception" }],
        },
      ]),
    );
    mockedSearchKeywords.mockResolvedValue({
      page: 1,
      results: [{ id: 100, name: "dream" }],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("REQ-4: busca candidatos após o debounce e lista o resultado", async () => {
    renderCombobox();

    await typeTerm("Nolan");

    expect(mockedSearchPeople).toHaveBeenCalledWith({
      query: "Nolan",
      language: undefined,
    });
    expect(screen.getByText("Christopher Nolan")).toBeInTheDocument();
    expect(screen.getByText("Directing")).toBeInTheDocument();
  });

  it("REQ-4: escolher candidato adiciona o id e limpa o input", async () => {
    const { onChange } = renderCombobox();
    mockedSearchPeople.mockResolvedValue(
      personPage([
        {
          id: 525,
          name: "Christopher Nolan",
          knownForDepartment: "Directing",
          knownFor: [],
        },
      ]),
    );

    await typeTerm("Nolan");
    fireEvent.click(screen.getByText("Christopher Nolan"));

    expect(onChange).toHaveBeenCalledWith([525]);
    expect(screen.getByLabelText("Diretor")).toHaveValue("");
  });

  it("REQ-4: múltiplos candidatos entram como OR na lista", async () => {
    const { onChange } = renderCombobox({ value: [525] });
    mockedSearchPeople.mockResolvedValue(
      personPage([
        {
          id: 1032,
          name: "Denis Villeneuve",
          knownForDepartment: "Directing",
          knownFor: [],
        },
      ]),
    );

    await typeTerm("Villeneuve");
    fireEvent.click(screen.getByText("Denis Villeneuve"));

    expect(onChange).toHaveBeenCalledWith([525, 1032]);
  });

  it("edge: combobox sem resultados mostra 'No results'", async () => {
    mockedSearchPeople.mockResolvedValue(personPage([]));

    renderCombobox();
    await typeTerm("Zzzzz");

    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("edge: falha na busca mostra mensagem de erro", async () => {
    mockedSearchPeople.mockRejectedValue(new Error("network"));

    renderCombobox();
    await typeTerm("Nolan");

    expect(
      screen.getByText("Could not load candidates."),
    ).toBeInTheDocument();
  });

  it("edge: query em branco não chama a API", () => {
    renderCombobox();

    fireEvent.change(screen.getByLabelText("Diretor"), {
      target: { value: "   " },
    });

    expect(mockedSearchPeople).not.toHaveBeenCalled();
  });

  it("edge: remove chip e devolve a lista sem o id", () => {
    const { onChange } = renderCombobox({
      value: [525],
      selectedLabels: { 525: "Christopher Nolan" },
    });

    expect(screen.getByText("Christopher Nolan")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Christopher Nolan" }),
    );

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("edge: usa fallback #id quando o rótulo não é conhecido", () => {
    renderCombobox({ value: [999] });

    expect(screen.getByText("#999")).toBeInTheDocument();
  });

  it("REQ-4 edge: kind keyword usa searchKeywords", async () => {
    renderCombobox({ kind: "keyword" });

    await typeTerm("dream");

    expect(mockedSearchKeywords).toHaveBeenCalledWith({ query: "dream" });
    expect(mockedSearchPeople).not.toHaveBeenCalled();
    expect(screen.getByText("dream")).toBeInTheDocument();
  });

  it("edge: exibe Searching... enquanto carrega", () => {
    renderCombobox();

    fireEvent.change(screen.getByLabelText("Diretor"), {
      target: { value: "Nolan" },
    });

    expect(screen.getByText("Searching...")).toBeInTheDocument();
  });

  it("edge: clicar em candidato já selecionado remove o id", async () => {
    const { onChange } = renderCombobox({
      value: [525],
      selectedLabels: { 525: "Christopher Nolan" },
    });
    mockedSearchPeople.mockResolvedValue(
      personPage([
        {
          id: 525,
          name: "Christopher Nolan",
          knownForDepartment: "Directing",
          knownFor: [],
        },
      ]),
    );

    await typeTerm("Nolan");
    const option = screen.getAllByText("Christopher Nolan")[1];
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("M2: ignora resposta de consulta antiga quando o termo muda", async () => {
    const staleResponse = deferred<PersonPage>();
    const latestResponse = deferred<PersonPage>();
    mockedSearchPeople
      .mockReturnValueOnce(staleResponse.promise)
      .mockReturnValueOnce(latestResponse.promise);

    renderCombobox();
    await typeTerm("Nol");
    await typeTerm("Nolan");

    latestResponse.resolve(
      personPage([
        {
          id: 999,
          name: "Latest Result",
          knownForDepartment: "Directing",
          knownFor: [],
        },
      ]),
    );
    await act(async () => {});
    staleResponse.resolve(
      personPage([
        {
          id: 111,
          name: "Stale Result",
          knownForDepartment: "Acting",
          knownFor: [],
        },
      ]),
    );
    await act(async () => {});

    expect(screen.getByText("Latest Result")).toBeInTheDocument();
    expect(screen.queryByText("Stale Result")).not.toBeInTheDocument();
  });

  it("M3: rótulo aprendido persiste no sessionStorage e é usado após remount", async () => {
    const { unmount } = renderCombobox();

    await typeTerm("Nolan");
    expect(screen.getByText("Christopher Nolan")).toBeInTheDocument();

    unmount();

    renderCombobox({ value: [525] });

    expect(screen.getByText("Christopher Nolan")).toBeInTheDocument();
    expect(screen.queryByText("#525")).not.toBeInTheDocument();
  });
});
