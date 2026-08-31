import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavigateFunction, useNavigate } from "react-router";
import { AccessTokenStorage } from "@/features/auth/utils/access-token.storage";
import { AuthService } from "@/features/auth/services/auth.service";
import { MovieSilentRefresh } from "@/lib/api/movie-silent-refresh";
import { StringUtils } from "@/utils/string.utils";

type AuthContextValue = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [accessToken, setAccessTokenState] = useState<string | null>(() =>
    AccessTokenStorage.get(),
  );

  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);

    if (StringUtils.isEmptyString(token)) {
      AccessTokenStorage.clear();
      return;
    }

    AccessTokenStorage.set(token);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
  }, [setAccessToken]);

  useEffect(() => {
    const handleSessionExpired = () => {
      void expireSessionAndGoToLogin(clearSession, navigate);
    };

    MovieSilentRefresh.setOnSessionExpired(handleSessionExpired);

    return () => {
      MovieSilentRefresh.setOnSessionExpired(null);
    };
  }, [clearSession, navigate]);

  const value = useMemo(
    () => ({ accessToken, setAccessToken, clearSession }),
    [accessToken, setAccessToken, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function expireSessionAndGoToLogin(
  clearSession: () => void,
  navigate: NavigateFunction,
): Promise<void> {
  clearSession();

  try {
    await AuthService.logout();
  } catch (error) {
    console.warn(
      "[AuthProvider] logout na expiração de sessão falhou; redirecionando para login",
      error,
    );
  }

  navigate("/login");
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
