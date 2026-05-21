import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { GlobalContext } from "./GlobalContext.tsx";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { RouterProvider } from "react-router";
import { routers } from "./routes";
import { Toaster } from "react-hot-toast";

export function Root() {
  return (
    // <StrictMode>
    <GlobalContext>
      <ThemeProvider>
        <Toaster />
        <App />
      </ThemeProvider>
    </GlobalContext>
    // </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={routers} />
);
