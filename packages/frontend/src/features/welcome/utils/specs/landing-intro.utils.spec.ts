import { LandingIntroUtils } from "../landing-intro.utils";

describe("LandingIntroUtils.prefersReducedMotion", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("é true quando o usuário pediu menos movimento", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as never;

    expect(LandingIntroUtils.prefersReducedMotion()).toBe(true);
  });

  it("é false sem preferência de menos movimento", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as never;

    expect(LandingIntroUtils.prefersReducedMotion()).toBe(false);
  });
});

describe("LandingIntroUtils seen flag", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("não viu a abertura por padrão", () => {
    expect(LandingIntroUtils.hasSeen()).toBe(false);
  });

  it("marca e relê a abertura como vista", () => {
    LandingIntroUtils.markSeen();

    expect(LandingIntroUtils.hasSeen()).toBe(true);
  });
});
