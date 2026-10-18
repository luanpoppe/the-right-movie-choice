const SEEN_INTRO_STORAGE_KEY = "landing-intro-seen";

export class LandingIntroUtils {
  static prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

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
