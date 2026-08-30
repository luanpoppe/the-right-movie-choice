import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { AccessTokenStorage } from "@/features/auth/utils/access-token.storage";
import { AuthService } from "@/features/auth/services/auth.service";
import { MovieSilentRefresh } from "../movie-silent-refresh";

jest.mock("@/utils/env", () => ({
  env: {
    VITE_BACKEND_URL: "http://backend.test",
    VITE_GOOGLE_CLIENT_ID: "test-google-client-id",
    VITE_NODE_ENV: "test",
  },
}));

type MovieRequestConfig = InternalAxiosRequestConfig & {
  _silentRefreshRetry?: boolean;
};

const refreshedTokens = {
  accessToken: "new-access-token",
  expiresIn: 3600,
  tokenType: "Bearer" as const,
};

async function waitUntil(isReady: () => boolean): Promise<void> {
  const deadline = Date.now() + 1000;
  while (!isReady()) {
    const hasTimedOut = Date.now() > deadline;
    if (hasTimedOut) {
      return;
    }

    const nextTick = new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    await nextTick;
  }
}

function createUnauthorizedError(
  config: InternalAxiosRequestConfig,
): AxiosError {
  const error = new AxiosError("Unauthorized");
  error.config = config;
  error.response = {
    data: {},
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
  };
  return error;
}

function createClient(params: {
  failAfterRetry?: boolean;
}): ReturnType<typeof axios.create> {
  const failAfterRetry = params.failAfterRetry === true;

  const client = axios.create({
    adapter: async (config) => {
      const requestConfig = config as MovieRequestConfig;
      const isRetry = requestConfig._silentRefreshRetry === true;
      const shouldSucceed = isRetry && !failAfterRetry;
      if (shouldSucceed) {
        return {
          data: { ok: true },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      }

      throw createUnauthorizedError(config);
    },
  });

  MovieSilentRefresh.installMovieSilentRefreshInterceptor(client);
  return client;
}

describe("MovieSilentRefresh", () => {
  let onSessionExpired: jest.Mock;

  beforeEach(() => {
    onSessionExpired = jest.fn();
    MovieSilentRefresh.setOnSessionExpired(onSessionExpired);
  });

  afterEach(() => {
    MovieSilentRefresh.resetForTests();
    jest.restoreAllMocks();
  });

  it("não chama refresh em 401 sem token", async () => {
    jest.spyOn(AccessTokenStorage, "get").mockReturnValue(null);
    const refreshSpy = jest.spyOn(AuthService, "refresh");
    const client = createClient({});

    await expect(client.get("/movie/recommendation")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("em 401 com token chama refresh uma vez e retenta", async () => {
    jest.spyOn(AccessTokenStorage, "get").mockReturnValue("expired-token");
    const refreshSpy = jest
      .spyOn(AuthService, "refresh")
      .mockResolvedValue(refreshedTokens);
    const setSpy = jest.spyOn(AccessTokenStorage, "set");
    const client = createClient({});

    const response = await client.get("/movie/recommendation");

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledWith(refreshedTokens.accessToken);
    expect(response.status).toBe(200);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("faz single-flight: dois 401 simultâneos disparam um único refresh", async () => {
    jest.spyOn(AccessTokenStorage, "get").mockReturnValue("expired-token");
    jest.spyOn(AccessTokenStorage, "set");

    let resolveRefresh: (value: typeof refreshedTokens) => void = () => {};
    const refreshSpy = jest.spyOn(AuthService, "refresh").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const client = createClient({});
    const firstRequest = client.get("/movie/recommendation");
    const secondRequest = client.get("/movie/recommendation");

    await waitUntil(() => refreshSpy.mock.calls.length === 1);
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    resolveRefresh(refreshedTokens);

    const [firstResponse, secondResponse] = await Promise.all([
      firstRequest,
      secondRequest,
    ]);

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
  });

  it("em retry já marcado com 401 chama onSessionExpired sem segundo refresh", async () => {
    jest.spyOn(AccessTokenStorage, "get").mockReturnValue("expired-token");
    const refreshSpy = jest
      .spyOn(AuthService, "refresh")
      .mockResolvedValue(refreshedTokens);
    const client = createClient({ failAfterRetry: true });

    await expect(client.get("/movie/recommendation")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("quando o refresh é rejeitado limpa o storage e chama onSessionExpired", async () => {
    jest.spyOn(AccessTokenStorage, "get").mockReturnValue("expired-token");
    jest.spyOn(AuthService, "refresh").mockRejectedValue(new Error("refresh failed"));
    const clearSpy = jest.spyOn(AccessTokenStorage, "clear");
    const client = createClient({});

    await expect(client.get("/movie/recommendation")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(clearSpy).toHaveBeenCalled();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
