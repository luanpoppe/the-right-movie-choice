import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLogout } from "@/features/auth/hooks/use-logout.hook";
import { cn, focusRingClassName } from "@/lib/utils";
import { Link, useLocation } from "react-router";
import type { ReactNode } from "react";
import { LogoIcon } from "./LogoIcon";
import { MobileNav } from "./MobileNav";

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
  const { accessToken } = useAuth();
  const logout = useLogout();

  if (accessToken) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="ml-1 rounded-lg"
        onClick={logout}
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
    "flex items-center gap-2.5 min-w-0 cursor-pointer rounded-lg no-underline text-foreground",
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
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-2 px-4 sm:px-6">
        <HomeBrandLink>
          <LogoIcon />
          <span className="truncate font-display text-sm font-bold tracking-tight sm:text-[1.05rem]">
            The Right Movie Choice
          </span>
        </HomeBrandLink>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            <HeaderNavLink to="/search">Search</HeaderNavLink>
            {isAuthenticated && <AuthenticatedLinks />}
          </div>
          <ModeToggle />
          <div className="hidden md:flex">
            <AccountActions />
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
