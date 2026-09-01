import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AuthService } from "@/features/auth/services/auth.service";
import { Link, useLocation } from "react-router";
import toast from "react-hot-toast";
import type { ReactNode } from "react";

function LogoIcon() {
  return (
    <img
      src="/favicon.png"
      alt=""
      width={48}
      height={48}
      className="h-12 w-12 drop-shadow-lg"
    />
  );
}

function HeaderTitle() {
  return (
    <h1 className="text-2xl font-bold text-balance bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
      The Right Movie Choice
    </h1>
  );
}

function HeaderSubTitle() {
  return (
    <p className="text-sm text-muted-foreground">
      Discover your perfect movie with AI-powered recommendations
    </p>
  );
}

function AuthActions() {
  const { accessToken, clearSession } = useAuth();

  async function handleLogout() {
    try {
      await AuthService.logout();
      clearSession();
      toast.success("Sessão encerrada.");
    } catch {
      clearSession();
      toast.error("Não foi possível encerrar a sessão no servidor.");
    }
  }

  if (accessToken) {
    return (
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Sair
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/login">Entrar</Link>
      </Button>
      <Button size="sm" asChild>
        <Link to="/register">Criar conta</Link>
      </Button>
    </div>
  );
}

function HomeBrandLink({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const brandClassName = "flex items-center gap-3 cursor-pointer no-underline";

  if (isHomePage) {
    return (
      <div
        onClick={() => {
          window.location.reload();
        }}
        className={brandClassName}
      >
        {children}
      </div>
    );
  }

  return (
    <Link to="/" className={brandClassName}>
      {children}
    </Link>
  );
}

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-6 py-6">
        <HomeBrandLink>
          <LogoIcon />
          <div>
            <HeaderTitle />
            <HeaderSubTitle />
          </div>
        </HomeBrandLink>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
