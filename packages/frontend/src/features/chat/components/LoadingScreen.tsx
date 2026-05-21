export function LoadingScreen() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
      </div>
      <span className="text-sm">Finding perfect movies for you...</span>
    </div>
  );
}
