import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AuthTokensEnum } from "@/utils/enums/auth.enum";

type AuthContextValue = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() =>
    sessionStorage.getItem(AuthTokensEnum.AUTH_TOKEN),
  );

  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);

    if (token) {
      sessionStorage.setItem(AuthTokensEnum.AUTH_TOKEN, token);
    } else {
      sessionStorage.removeItem(AuthTokensEnum.AUTH_TOKEN);
    }
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
  }, [setAccessToken]);

  const value = useMemo(
    () => ({ accessToken, setAccessToken, clearSession }),
    [accessToken, setAccessToken, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
