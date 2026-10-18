export type LandingIntroMode = "cinema" | "leader";

const DEFAULT_MODE: LandingIntroMode = "cinema";
const SEEN_INTRO_STORAGE_KEY = "landing-intro-seen";

export class LandingIntroModeUtils {
  static readExplicit(search: string): LandingIntroMode | null {
    const requestedMode = new URLSearchParams(search).get("intro");
    if (requestedMode === "leader" || requestedMode === "cinema") {
      return requestedMode;
    }

    return null;
  }

  static read(search: string): LandingIntroMode {
    const explicitMode = LandingIntroModeUtils.readExplicit(search);
    if (explicitMode !== null) {
      return explicitMode;
    }

    return DEFAULT_MODE;
  }

  static prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
}

export class FilmLeaderIntroUtils {
  static hasSeen(): boolean {
    if (typeof window === "undefined") {
      return true;
    }

    return window.sessionStorage.getItem(SEEN_INTRO_STORAGE_KEY) === "1";
  }

  static markSeen(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(SEEN_INTRO_STORAGE_KEY, "1");
  }
}
