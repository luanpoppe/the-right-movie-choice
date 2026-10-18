interface LandingIntroReplayButtonProps {
  onReplay: () => void;
}

export function LandingIntroReplayButton({
  onReplay,
}: LandingIntroReplayButtonProps) {
  return (
    <button
      type="button"
      data-testid="landing-intro-replay"
      onClick={onReplay}
      className="fixed bottom-4 left-4 z-[110] rounded-full border border-border bg-card/90 px-3 py-1 text-xs text-muted-foreground shadow-lg backdrop-blur transition-colors hover:text-foreground"
    >
      Replay intro
    </button>
  );
}
