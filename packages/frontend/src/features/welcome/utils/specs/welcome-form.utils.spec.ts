import { WelcomeFormUtils } from "../welcome-form.utils";

describe("WelcomeFormUtils.shouldAutoFocusTextarea", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("é true em viewports a partir de 768px", () => {
    const matchMedia = jest.fn().mockReturnValue({ matches: true });
    window.matchMedia = matchMedia as never;

    expect(WelcomeFormUtils.shouldAutoFocusTextarea()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith("(min-width: 768px)");
  });

  it("é false em viewports menores que 768px", () => {
    const matchMedia = jest.fn().mockReturnValue({ matches: false });
    window.matchMedia = matchMedia as never;

    expect(WelcomeFormUtils.shouldAutoFocusTextarea()).toBe(false);
  });

  it("é false quando matchMedia não está disponível", () => {
    window.matchMedia = undefined as never;

    expect(WelcomeFormUtils.shouldAutoFocusTextarea()).toBe(false);
  });
});
