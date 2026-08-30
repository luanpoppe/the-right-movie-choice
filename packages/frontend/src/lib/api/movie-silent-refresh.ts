import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { AccessTokenStorage } from "@/features/auth/utils/access-token.storage";
import { AuthService } from "@/features/auth/services/auth.service";
import { StringUtils } from "@/utils/string.utils";

type SessionExpiredHandler = () => void;

type MovieRequestConfig = InternalAxiosRequestConfig & {
  _silentRefreshRetry?: boolean;
};

export class MovieSilentRefresh {
  private static onSessionExpired: SessionExpiredHandler | null = null;
  private static inFlightRefresh: Promise<string> | null = null;

  static setOnSessionExpired(handler: SessionExpiredHandler | null): void {
    this.onSessionExpired = handler;
  }

  static resetForTests(): void {
    this.onSessionExpired = null;
    this.inFlightRefresh = null;
  }

  static installMovieSilentRefreshInterceptor(client: AxiosInstance): void {
    client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleResponseError(error, client),
    );
  }

  private static async handleResponseError(
    error: AxiosError,
    client: AxiosInstance,
  ): Promise<unknown> {
    const isUnauthorized = error.response?.status === 401;
    if (!isUnauthorized) {
      return Promise.reject(error);
    }

    const requestConfig = error.config as MovieRequestConfig | undefined;
    if (!requestConfig) {
      return Promise.reject(error);
    }

    const alreadyRetried = requestConfig._silentRefreshRetry === true;
    if (alreadyRetried) {
      this.notifySessionExpired();
      return Promise.reject(error);
    }

    const storedAccessToken = AccessTokenStorage.get();
    if (StringUtils.isEmptyString(storedAccessToken)) {
      return Promise.reject(error);
    }

    try {
      const newAccessToken = await this.refreshOnce();
      requestConfig._silentRefreshRetry = true;
      requestConfig.headers.Authorization = `Bearer ${newAccessToken}`;
      return client.request(requestConfig);
    } catch {
      this.notifySessionExpired();
      return Promise.reject(error);
    }
  }

  private static refreshOnce(): Promise<string> {
    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }

    const refreshPromise = this.executeRefresh().finally(() => {
      this.inFlightRefresh = null;
    });

    this.inFlightRefresh = refreshPromise;
    return refreshPromise;
  }

  private static async executeRefresh(): Promise<string> {
    const tokens = await AuthService.refresh();
    const newAccessToken = tokens.accessToken;
    AccessTokenStorage.set(newAccessToken);
    return newAccessToken;
  }

  private static notifySessionExpired(): void {
    AccessTokenStorage.clear();
    console.warn("[MovieSilentRefresh] sessão expirada");
    this.onSessionExpired?.();
  }
}
