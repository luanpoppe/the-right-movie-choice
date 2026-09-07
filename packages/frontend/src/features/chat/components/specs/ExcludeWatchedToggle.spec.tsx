import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExcludeWatchedToggle } from "../ExcludeWatchedToggle";

function renderToggle(
  overrides: Partial<{
    showToggle: boolean;
    excludeWatched: boolean;
    onExcludeWatchedChange: (value: boolean) => void;
    isLoading: boolean;
    isGuestLocked: boolean;
  }> = {},
) {
  const onExcludeWatchedChange = jest.fn();
  const props = {
    showToggle: true,
    excludeWatched: true,
    onExcludeWatchedChange,
    isLoading: false,
    isGuestLocked: false,
    ...overrides,
  };

  render(<ExcludeWatchedToggle {...props} />);

  return { onExcludeWatchedChange: props.onExcludeWatchedChange };
}

function getExcludeWatchedCheckbox() {
  return screen.getByRole("checkbox", { name: /exclude watched movies/i });
}

describe("ExcludeWatchedToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("REQ-1: renderiza ligado quando showToggle é true e excludeWatched é true", () => {
    renderToggle({ showToggle: true, excludeWatched: true });

    const checkbox = getExcludeWatchedCheckbox();
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it("REQ-2: não renderiza quando showToggle é false", () => {
    renderToggle({ showToggle: false });

    expect(
      screen.queryByRole("checkbox", { name: /exclude watched movies/i }),
    ).not.toBeInTheDocument();
  });

  it("REQ-7: fica desabilitado durante isLoading", () => {
    renderToggle({ isLoading: true });

    expect(getExcludeWatchedCheckbox()).toBeDisabled();
  });

  it("edge guest lock: fica desabilitado quando isGuestLocked é true", () => {
    renderToggle({ isGuestLocked: true });

    expect(getExcludeWatchedCheckbox()).toBeDisabled();
  });

  it("REQ-4: chama onExcludeWatchedChange ao desmarcar", async () => {
    const user = userEvent.setup();
    const { onExcludeWatchedChange } = renderToggle({ excludeWatched: true });

    await user.click(getExcludeWatchedCheckbox());

    expect(onExcludeWatchedChange).toHaveBeenCalledWith(false);
  });
});
