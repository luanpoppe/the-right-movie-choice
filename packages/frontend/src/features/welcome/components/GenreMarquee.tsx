const GENRES = [
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Sci-Fi",
  "Documentary",
  "Romance",
  "Thriller",
  "Animation",
  "Crime",
  "Adventure",
  "Mystery",
];

function GenreStrip() {
  return (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {GENRES.map((genre) => (
        <span
          key={genre}
          className="whitespace-nowrap font-display text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          {genre}
        </span>
      ))}
    </div>
  );
}

export function GenreMarquee() {
  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-border py-4 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <GenreStrip />
        <GenreStrip />
      </div>
    </div>
  );
}
