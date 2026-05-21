import { Header } from "./layouts/Header";
import { Home } from "./pages/Home";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <Header />

      <Home />
    </main>
  );
}
