import {
  FilmLeaderIntroUtils,
  LandingIntroModeUtils,
} from "../landing-intro-mode.utils";

describe("LandingIntroModeUtils.read", () => {
  it("usa o modo cinema por padrão", () => {
    expect(LandingIntroModeUtils.read("")).toBe("cinema");
  });

  it("lê o modo leader da query string", () => {
    expect(LandingIntroModeUtils.read("?intro=leader")).toBe("leader");
  });

  it("lê o modo cinema explícito", () => {
    expect(LandingIntroModeUtils.read("?intro=cinema")).toBe("cinema");
  });

  it("ignora valor desconhecido e volta ao padrão", () => {
    expect(LandingIntroModeUtils.read("?intro=whatever")).toBe("cinema");
  });
});

describe("LandingIntroModeUtils.readExplicit", () => {
  it("retorna null quando não há o parâmetro", () => {
    expect(LandingIntroModeUtils.readExplicit("")).toBeNull();
  });

  it("retorna o modo quando explícito", () => {
    expect(LandingIntroModeUtils.readExplicit("?intro=leader")).toBe("leader");
  });

  it("retorna null para valor desconhecido", () => {
    expect(LandingIntroModeUtils.readExplicit("?intro=whatever")).toBeNull();
  });
});

describe("LandingIntroModeUtils.prefersReducedMotion", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("é true quando o usuário pediu menos movimento", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as never;

    expect(LandingIntroModeUtils.prefersReducedMotion()).toBe(true);
  });

  it("é false sem preferência de menos movimento", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as never;

    expect(LandingIntroModeUtils.prefersReducedMotion()).toBe(false);
  });
});

describe("FilmLeaderIntroUtils", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("não viu o intro por padrão", () => {
    expect(FilmLeaderIntroUtils.hasSeen()).toBe(false);
  });

  it("marca e relê o intro como visto", () => {
    FilmLeaderIntroUtils.markSeen();

    expect(FilmLeaderIntroUtils.hasSeen()).toBe(true);
  });
});
