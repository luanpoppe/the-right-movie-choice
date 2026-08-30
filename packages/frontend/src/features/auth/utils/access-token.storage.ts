import { AuthTokensEnum } from "@/utils/enums/auth.enum";

export class AccessTokenStorage {
  static get(): string | null {
    return sessionStorage.getItem(AuthTokensEnum.AUTH_TOKEN);
  }

  static set(token: string): void {
    sessionStorage.setItem(AuthTokensEnum.AUTH_TOKEN, token);
  }

  static clear(): void {
    sessionStorage.removeItem(AuthTokensEnum.AUTH_TOKEN);
  }
}
