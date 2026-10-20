const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

export class WelcomeFormUtils {
  static shouldAutoFocusTextarea(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
  }
}
