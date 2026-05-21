import { Film } from "lucide-react";

export function Hero() {
  return (
    <div className="text-center space-y-6">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-3xl opacity-30 rounded-full" />
        <div className="relative rounded-3xl bg-gradient-to-br from-primary to-accent p-8 shadow-2xl shadow-primary/30">
          <Film className="w-20 h-20 text-primary-foreground" />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold text-balance bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
          Find Your Perfect Movie
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
          Tired of scrolling endlessly? Tell me what you're in the mood for, and
          I'll recommend three amazing movies tailored just for you.
        </p>
      </div>
    </div>
  );
}
