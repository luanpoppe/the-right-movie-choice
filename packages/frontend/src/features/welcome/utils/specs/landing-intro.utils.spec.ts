import { LandingIntroUtils } from "../landing-intro.utils";

describe("LandingIntroUtils.consumeEntranceAnimation", () => {
  it("libera a animação no primeiro consumo e bloqueia depois", () => {
    expect(LandingIntroUtils.consumeEntranceAnimation()).toBe(true);
    expect(LandingIntroUtils.consumeEntranceAnimation()).toBe(false);
  });
});

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
