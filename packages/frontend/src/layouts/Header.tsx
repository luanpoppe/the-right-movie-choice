import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AuthService } from "@/features/auth/services/auth.service";
import { cn, focusRingClassName } from "@/lib/utils";
import { Link, useLocation } from "react-router";
import toast from "react-hot-toast";
import type { ReactNode } from "react";

function LogoIcon() {
  return (
    <img
      src="/favicon.png"
      alt=""
      width={36}
      height={36}
      className="h-9 w-9 rounded-lg"
    />
  );
}

const navLinkClassName = cn(
  "rounded-lg px-3 py-1.5 text-sm text-muted-foreground no-underline transition-colors hover:bg-secondary hover:text-foreground",
  focusRingClassName,
);

function HeaderNavLink({ to, children }: { to: string; children: ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={cn(navLinkClassName, isActive && "text-foreground")}>
      {children}
    </Link>
  );
}

function AuthenticatedLinks() {
  return (
    <>
      <HeaderNavLink to="/conversations">Conversations</HeaderNavLink>
      <HeaderNavLink to="/social">Social</HeaderNavLink>
      <HeaderNavLink to="/my-movies">My movies</HeaderNavLink>
    </>
  );
}

function AccountActions() {
  const { accessToken, clearSession } = useAuth();

  async function handleLogout() {
    try {
      await AuthService.logout();
      clearSession();
      toast.success("Signed out.");
    } catch {
      clearSession();
      toast.error("Could not sign out on the server.");
    }
  }

  if (accessToken) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="ml-1 rounded-lg"
        onClick={handleLogout}
      >
        Sign out
      </Button>
    );
  }

  return (
    <div className="ml-1 flex items-center gap-1">
      <Button variant="ghost" size="sm" className="rounded-lg" asChild>
        <Link to="/login">Sign in</Link>
      </Button>
      <Button size="sm" className="rounded-lg" asChild>
        <Link to="/register">Create account</Link>
      </Button>
    </div>
  );
}

function HomeBrandLink({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const brandClassName = cn(
    "flex items-center gap-2.5 cursor-pointer rounded-lg no-underline text-foreground",
    focusRingClassName,
  );

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
  const { accessToken } = useAuth();
  const isAuthenticated = Boolean(accessToken);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <HomeBrandLink>
          <LogoIcon />
          <span className="font-display text-[1.05rem] font-bold tracking-tight">
            The Right Movie Choice
          </span>
        </HomeBrandLink>

        <div className="flex items-center gap-1">
          <HeaderNavLink to="/search">Search</HeaderNavLink>
          {isAuthenticated && <AuthenticatedLinks />}
          <ModeToggle />
          <AccountActions />
        </div>
      </div>
    </header>
  );
}
