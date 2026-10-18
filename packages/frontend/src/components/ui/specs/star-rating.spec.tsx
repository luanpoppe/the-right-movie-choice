import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StarRating } from "../star-rating";

jest.mock("lucide-react", () => ({
  Star: () => <span data-testid="icon-star" />,
}));

describe("StarRating", () => {
  it("renderiza max estrelas como radios acessíveis", () => {
    render(<StarRating value={0} onChange={jest.fn()} max={10} />);

    expect(screen.getAllByRole("radio")).toHaveLength(10);
    expect(
      screen.getByRole("radio", { name: "10 of 10 stars" }),
    ).toBeInTheDocument();
  });

  it("marca como checked a estrela da nota atual", () => {
    render(<StarRating value={7} onChange={jest.fn()} />);

    expect(screen.getByRole("radio", { name: "7 of 10 stars" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "8 of 10 stars" }),
    ).not.toBeChecked();
  });

  it("clicar numa estrela emite a nota escolhida", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<StarRating value={0} onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "7 of 10 stars" }));

    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("nota nula não marca nenhuma estrela", () => {
    render(<StarRating value={0} onChange={jest.fn()} />);

    expect(
      screen
        .getAllByRole("radio")
        .some((radio) => (radio as HTMLInputElement).checked),
    ).toBe(false);
  });

  it("desabilitado não emite a nota", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<StarRating value={0} onChange={onChange} disabled />);

    await user.click(screen.getByRole("radio", { name: "3 of 10 stars" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
