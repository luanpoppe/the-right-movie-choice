import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { AccessTokenStorage } from "@/features/auth/utils/access-token.storage";
import { movieClient } from "../movie-client";

jest.mock("@/utils/env", () => ({
  env: {
    VITE_BACKEND_URL: "http://backend.test",
    VITE_GOOGLE_CLIENT_ID: "test-google-client-id",
    VITE_NODE_ENV: "test",
  },
}));

async function applyRequestInterceptors(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  const interceptorManager = movieClient.interceptors.request as unknown as {
    handlers: Array<{
      fulfilled?: (
        value: InternalAxiosRequestConfig
      ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
    }>;
  };

  let nextConfig = config;
  for (const handler of interceptorManager.handlers) {
    if (!handler.fulfilled) {
      continue;
    }

    nextConfig = await handler.fulfilled(nextConfig);
  }

  return nextConfig;
}

function createRequestConfig(): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig;
}

describe("movieClient", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("não envia Authorization quando não há token", async () => {
    jest.spyOn(AccessTokenStorage, "get").mockReturnValue(null);

    const requestConfig = createRequestConfig();
    const nextConfig = await applyRequestInterceptors(requestConfig);
    const authorizationHeader = nextConfig.headers.get("Authorization");

    expect(authorizationHeader).toBeUndefined();
  });

  it("envia Authorization Bearer quando há token", async () => {
    const accessToken = "access-token-value";
    jest.spyOn(AccessTokenStorage, "get").mockReturnValue(accessToken);

    const requestConfig = createRequestConfig();
    const nextConfig = await applyRequestInterceptors(requestConfig);
    const authorizationHeader = nextConfig.headers.get("Authorization");

    expect(authorizationHeader).toBe(`Bearer ${accessToken}`);
  });

  it("usa withCredentials true na instância", () => {
    expect(movieClient.defaults.withCredentials).toBe(true);
  });
});
