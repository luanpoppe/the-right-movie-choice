import axios from "axios";
import { AccessTokenStorage } from "@/features/auth/utils/access-token.storage";
import { env } from "@/utils/env";
import { StringUtils } from "@/utils/string.utils";
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
  if (StringUtils.isEmptyString(accessToken)) {
    return config;
  }

  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

MovieSilentRefresh.installMovieSilentRefreshInterceptor(movieClient);
