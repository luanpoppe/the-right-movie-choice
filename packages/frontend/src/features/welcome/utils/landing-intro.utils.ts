export class LandingIntroUtils {
  private static entrancePlayed = false;

  static consumeEntranceAnimation(): boolean {
    const alreadyPlayed = LandingIntroUtils.entrancePlayed;
    LandingIntroUtils.entrancePlayed = true;
    return !alreadyPlayed;
  }

  static prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
}
