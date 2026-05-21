import { ModeToggle } from "@/components/theme-toggle";
import { Film } from "lucide-react";

function ChangeTheme() {
  return (
    <div className="mt-5 mr-5">
      <ModeToggle />
    </div>
  );
}

function LogoIcon() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg shadow-primary/20">
      <Film className="w-6 h-6 text-primary-foreground" />
    </div>
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

export function Header() {
  function reloadPage() {
    window.location.reload();
  }

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
      <div className="flex">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div onClick={reloadPage} className="cursor-pointer">
              <LogoIcon />
            </div>
            <div onClick={reloadPage} className="cursor-pointer">
              <HeaderTitle />

              <HeaderSubTitle />
            </div>
          </div>
        </div>

        <ChangeTheme />
      </div>
    </header>
  );
}
