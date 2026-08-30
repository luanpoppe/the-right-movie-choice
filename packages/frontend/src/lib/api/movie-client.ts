import axios from "axios";
import { AccessTokenStorage } from "@/features/auth/utils/access-token.storage";
import { env } from "@/utils/env";
import { MovieSilentRefresh } from "./movie-silent-refresh";

export const movieClient = axios.create({
  baseURL: env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

movieClient.interceptors.request.use((config) => {
  const accessToken = AccessTokenStorage.get();
  const hasAccessToken =
    typeof accessToken === "string" && accessToken.length > 0;

  if (!hasAccessToken) {
    return config;
  }

  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

MovieSilentRefresh.installMovieSilentRefreshInterceptor(movieClient);
