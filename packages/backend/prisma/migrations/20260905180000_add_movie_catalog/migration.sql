-- CreateEnum
CREATE TYPE "MovieWatchProviderKind" AS ENUM ('flatrate', 'rent', 'buy');

-- CreateTable
CREATE TABLE "Movie" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "posterPath" TEXT,
    "overview" TEXT NOT NULL,
    "runtimeMinutes" INTEGER,
    "tmdbVoteAverage" DOUBLE PRECISION,
    "imdbId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieGenre" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "movieId" INTEGER NOT NULL,

    CONSTRAINT "MovieGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieDirector" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "movieId" INTEGER NOT NULL,

    CONSTRAINT "MovieDirector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieCast" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "movieId" INTEGER NOT NULL,

    CONSTRAINT "MovieCast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieOriginCountry" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "movieId" INTEGER NOT NULL,

    CONSTRAINT "MovieOriginCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieWatchProvider" (
    "id" SERIAL NOT NULL,
    "kind" "MovieWatchProviderKind" NOT NULL,
    "providerName" TEXT NOT NULL,
    "logoPath" TEXT,
    "movieId" INTEGER NOT NULL,

    CONSTRAINT "MovieWatchProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_language_key" ON "Movie"("tmdbId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_imdbId_language_key" ON "Movie"("imdbId", "language");

-- CreateIndex
CREATE INDEX "MovieGenre_movieId_idx" ON "MovieGenre"("movieId");

-- CreateIndex
CREATE INDEX "MovieDirector_movieId_idx" ON "MovieDirector"("movieId");

-- CreateIndex
CREATE INDEX "MovieCast_movieId_idx" ON "MovieCast"("movieId");

-- CreateIndex
CREATE INDEX "MovieOriginCountry_movieId_idx" ON "MovieOriginCountry"("movieId");

-- CreateIndex
CREATE INDEX "MovieWatchProvider_movieId_idx" ON "MovieWatchProvider"("movieId");

-- AddForeignKey
ALTER TABLE "MovieGenre" ADD CONSTRAINT "MovieGenre_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieDirector" ADD CONSTRAINT "MovieDirector_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieCast" ADD CONSTRAINT "MovieCast_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieOriginCountry" ADD CONSTRAINT "MovieOriginCountry_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieWatchProvider" ADD CONSTRAINT "MovieWatchProvider_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
