import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-lg flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="font-display text-6xl font-bold tracking-tight text-primary">
        404
      </p>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/search">Search movies</Link>
        </Button>
      </div>
    </div>
  );
}
