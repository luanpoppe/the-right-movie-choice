import { Outlet } from "react-router";
import { Header } from "./layouts/Header";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      <Outlet />
    </main>
  );
}
