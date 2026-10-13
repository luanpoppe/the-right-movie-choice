import { Outlet, useLocation } from "react-router";
import { CursorGlow } from "./components/cursor-glow";
import { Header } from "./layouts/Header";

export default function App() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <main className="relative flex min-h-[100dvh] flex-col text-foreground">
      {isHomePage && <CursorGlow />}
      <Header />
      <Outlet />
    </main>
  );
}
