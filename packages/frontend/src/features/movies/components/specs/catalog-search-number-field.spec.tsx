import { fireEvent, render, screen } from "@testing-library/react";
import { CatalogSearchNumberField } from "../catalog-search-number-field";

describe("CatalogSearchNumberField", () => {
  it("renderiza label e valor", () => {
    render(
      <CatalogSearchNumberField
        id="filter-min-rating"
        label="Nota mínima"
        value={7}
        onChange={jest.fn()}
      />,
    );

    const input = screen.getByLabelText("Nota mínima");
    expect(input).toHaveValue(7);
  });

  it("converte texto numérico em número", () => {
    const onChange = jest.fn();
    render(
      <CatalogSearchNumberField
        id="filter-min-rating"
        label="Nota mínima"
        value={undefined}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nota mínima"), {
      target: { value: "7" },
    });

    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("edge: campo vazio devolve undefined", () => {
    const onChange = jest.fn();
    render(
      <CatalogSearchNumberField
        id="filter-min-rating"
        label="Nota mínima"
        value={7}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nota mínima"), {
      target: { value: "" },
    });

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("edge: entrada não numérica é ignorada pelo input", () => {
    const onChange = jest.fn();
    render(
      <CatalogSearchNumberField
        id="filter-min-rating"
        label="Nota mínima"
        value={undefined}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nota mínima"), {
      target: { value: "abc" },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("edge: aceita decimais", () => {
    const onChange = jest.fn();
    render(
      <CatalogSearchNumberField
        id="filter-min-rating"
        label="Nota mínima"
        value={undefined}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nota mínima"), {
      target: { value: "7.5" },
    });

    expect(onChange).toHaveBeenCalledWith(7.5);
  });
});
