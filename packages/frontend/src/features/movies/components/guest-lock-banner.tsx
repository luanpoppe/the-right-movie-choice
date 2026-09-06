import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function GuestLockBanner() {
  return (
    <div
      role="status"
      className="rounded-2xl border border-border/50 bg-card/80 p-4 shadow-lg space-y-3"
    >
      <p className="text-sm text-foreground">
        You&apos;ve reached the recommendation limit without an account. Create
        an account to keep using the chat.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" asChild>
          <Link to="/register">Create account</Link>
        </Button>
        <Link
          to="/login"
          className="text-sm text-primary hover:underline underline-offset-4"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
