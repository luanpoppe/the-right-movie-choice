-- CreateTable
CREATE TABLE "UserMovieEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "movieId" INTEGER,
    "watched" BOOLEAN NOT NULL DEFAULT false,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "inWatchlist" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "watchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMovieEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserMovieEntry_rating_check" CHECK ("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 10))
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMovieEntry_userId_tmdbId_key" ON "UserMovieEntry"("userId", "tmdbId");

-- CreateIndex
CREATE INDEX "UserMovieEntry_userId_watched_idx" ON "UserMovieEntry"("userId", "watched");

-- CreateIndex
CREATE INDEX "UserMovieEntry_userId_favorite_idx" ON "UserMovieEntry"("userId", "favorite");

-- CreateIndex
CREATE INDEX "UserMovieEntry_userId_inWatchlist_idx" ON "UserMovieEntry"("userId", "inWatchlist");

-- AddForeignKey
ALTER TABLE "UserMovieEntry" ADD CONSTRAINT "UserMovieEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMovieEntry" ADD CONSTRAINT "UserMovieEntry_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE SET NULL ON UPDATE CASCADE;
