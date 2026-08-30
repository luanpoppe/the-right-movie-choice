import { MovieSilentRefresh } from "./movie-silent-refresh";

type SessionExpiredCallback = () => void;

export class SessionExpiredHandler {
  static register(onSessionExpired: SessionExpiredCallback): void {
    MovieSilentRefresh.setOnSessionExpired(onSessionExpired);
  }

  static unregister(): void {
    MovieSilentRefresh.setOnSessionExpired(() => undefined);
  }
}
