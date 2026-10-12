import { Outlet } from "react-router";
import { CursorGlow } from "./components/cursor-glow";
import { Header } from "./layouts/Header";

export default function App() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col text-foreground">
      <CursorGlow />
      <Header />
      <Outlet />
    </main>
  );
}
