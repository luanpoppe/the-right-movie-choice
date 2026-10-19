import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLogout } from "@/features/auth/hooks/use-logout.hook";
import { cn } from "@/lib/utils";

// Navegacao para telas pequenas (< md). Usa o padrao de "disclosure"
// (botao + painel), nao role=menu — sao links de navegacao, nao um menu de
// aplicacao. O painel so existe no DOM quando aberto.
function itemClassName(isActive: boolean) {
  return cn(
    "block rounded-md px-3 py-2 text-sm text-muted-foreground no-underline transition-colors hover:bg-secondary hover:text-foreground",
    isActive && "font-medium text-foreground",
  );
}

export function MobileNav() {
  const { accessToken } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = Boolean(accessToken);

  // Fecha ao navegar (o Header persiste entre rotas).
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      const isInside = target ? containerRef.current?.contains(target) : true;
      if (!isInside) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleLogout() {
    setIsOpen(false);
    void logout();
  }

  return (
    <div ref={containerRef} className="relative md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-lg"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        aria-label="Open navigation menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>

      {isOpen ? (
        <div
          id="mobile-nav-panel"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <Link
            to="/search"
            className={itemClassName(location.pathname === "/search")}
          >
            Search
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/conversations"
                className={itemClassName(location.pathname === "/conversations")}
              >
                Conversations
              </Link>
              <Link
                to="/social"
                className={itemClassName(location.pathname === "/social")}
              >
                Social
              </Link>
              <Link
                to="/my-movies"
                className={itemClassName(location.pathname === "/my-movies")}
              >
                My movies
              </Link>

              <div className="my-1 h-px bg-border" />

              <button
                type="button"
                onClick={handleLogout}
                className={cn(itemClassName(false), "w-full text-left")}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="my-1 h-px bg-border" />

              <Link
                to="/login"
                className={itemClassName(location.pathname === "/login")}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className={itemClassName(location.pathname === "/register")}
              >
                Create account
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
