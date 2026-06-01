import { GoogleOAuthProvider } from "@react-oauth/google";
import { GlobalContext } from "./GlobalContext.tsx";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { Toaster } from "react-hot-toast";
import { env } from "./utils/env";
import { AuthProvider } from "./features/auth/context/AuthContext";

export function Root() {
  return (
    <GoogleOAuthProvider clientId={env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <GlobalContext>
          <ThemeProvider>
            <Toaster />
            <App />
          </ThemeProvider>
        </GlobalContext>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
