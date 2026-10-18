import { cn } from "@/lib/utils";
import { LandingIntroMode } from "../utils/landing-intro-mode.utils";

interface LandingIntroDevToggleProps {
  mode: LandingIntroMode;
  onSelect: (mode: LandingIntroMode) => void;
  onReplay: () => void;
}

export function LandingIntroDevToggle({
  mode,
  onSelect,
  onReplay,
}: LandingIntroDevToggleProps) {
  const buttonClass = (isActive: boolean) =>
    cn(
      "rounded-full px-2 py-0.5 transition-colors",
      isActive ? "bg-primary text-primary-foreground" : "hover:text-foreground",
    );

  return (
    <div
      data-testid="landing-intro-dev-toggle"
      className="fixed bottom-4 left-4 z-[110] flex items-center gap-1 rounded-full border border-border bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow-lg backdrop-blur"
    >
      <span className="px-1">Intro (dev):</span>
      <button
        type="button"
        className={buttonClass(mode === "cinema")}
        onClick={() => onSelect("cinema")}
      >
        Cinema
      </button>
      <button
        type="button"
        className={buttonClass(mode === "leader")}
        onClick={() => onSelect("leader")}
      >
        Leader
      </button>
      <button
        type="button"
        className="rounded-full px-2 py-0.5 hover:text-foreground"
        onClick={onReplay}
      >
        Replay
      </button>
    </div>
  );
}
