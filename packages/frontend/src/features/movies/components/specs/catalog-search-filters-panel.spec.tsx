jest.mock("../candidate-search-combobox", () => ({
  CandidateSearchCombobox: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number[];
    onChange: (ids: number[]) => void;
  }) => (
    <div>
      <span data-testid={`candidate-${label}`}>{value.join(",")}</span>
      <button
        type="button"
        onClick={() => onChange([...value, 525])}
      >{`add-${label}`}</button>
    </div>
  ),
}));

import { fireEvent, render, screen } from "@testing-library/react";
import type { CatalogSearchFilters } from "../../utils/catalog-search-filters.utils";
import { CatalogSearchFiltersPanel } from "../catalog-search-filters-panel";

function renderPanel(
  filters: CatalogSearchFilters = {},
  onApply: (filters: CatalogSearchFilters) => void = jest.fn(),
) {
  const view = render(
    <CatalogSearchFiltersPanel
      filters={filters}
      onApply={onApply}
      language="en-US"
    />,
  );

  return { onApply, ...view };
}

describe("CatalogSearchFiltersPanel", () => {
  it("REQ-3: aplicar gênero + nota + anos entrega os filtros", () => {
    const { onApply } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Drama" }));
    fireEvent.change(screen.getByLabelText("Minimum rating"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Year from"), {
      target: { value: "2010" },
    });
    fireEvent.change(screen.getByLabelText("Year to"), {
      target: { value: "2015" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        genres: [18],
        minRating: 7,
        yearFrom: 2010,
        yearTo: 2015,
      }),
    );
  });

  it("REQ-4: candidato selecionado entra no filtro de direção", () => {
    const { onApply } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "add-Director" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ director: [525] }),
    );
  });

  it("REQ-4: ator e palavra-chave também entram no apply", () => {
    const { onApply } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "add-Actor" }));
    fireEvent.click(screen.getByRole("button", { name: "add-Keyword" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ cast: [525], keyword: [525] }),
    );
  });

  it("edge: gênero já selecionado é removido ao clicar de novo", () => {
    const { onApply } = renderPanel({ genres: [18] });

    fireEvent.click(screen.getByRole("button", { name: "Drama" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ genres: [] }),
    );
  });

  it("edge: Clear zera o draft e aplica filtros vazios", () => {
    const { onApply } = renderPanel({ genres: [18], minRating: 7 });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ genres: undefined, minRating: undefined }),
    );
  });

  it("edge: filtros iniciais marcam os gêneros correspondentes", () => {
    renderPanel({ genres: [28] });

    expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("edge: certificação e duração são repassadas no apply", () => {
    const { onApply } = renderPanel();

    fireEvent.change(screen.getByLabelText("Runtime from"), {
      target: { value: "60" },
    });
    fireEvent.change(screen.getByLabelText("Runtime to"), {
      target: { value: "180" },
    });
    fireEvent.change(screen.getByLabelText("Country"), {
      target: { value: "BR" },
    });
    fireEvent.change(screen.getByLabelText("Certification"), {
      target: { value: "14" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeFrom: 60,
        runtimeTo: 180,
        certificationCountry: "BR",
        certification: "14",
      }),
    );
  });

  it("M4: refetch com os mesmos filtros aplicados não descarta o draft", () => {
    const onApply = jest.fn();
    const { rerender } = renderPanel({ genres: [18] }, onApply);

    fireEvent.change(screen.getByLabelText("Minimum rating"), {
      target: { value: "7" },
    });

    rerender(
      <CatalogSearchFiltersPanel
        filters={{ genres: [18] }}
        onApply={onApply}
        language="en-US"
      />,
    );

    expect(screen.getByLabelText("Minimum rating")).toHaveValue(7);

    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ genres: [18], minRating: 7 }),
    );
  });
});
