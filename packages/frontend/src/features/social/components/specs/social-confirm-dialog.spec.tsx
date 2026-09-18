jest.mock("lucide-react", () => ({
  X: () => <span data-testid="icon-x" />,
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialConfirmDialog } from "../social-confirm-dialog";

describe("SocialConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    title: "Remove friend",
    description: "Are you sure?",
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("REQ-10: confirmar chama onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn().mockResolvedValue(undefined);

    render(
      <SocialConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
        confirmLabel="Remove"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it("REQ-10: cancelar fecha sem chamar onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <SocialConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
