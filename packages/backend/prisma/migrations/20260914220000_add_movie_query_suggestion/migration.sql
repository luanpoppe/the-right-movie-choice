-- CreateTable
CREATE TABLE "MovieQuerySuggestion" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "textNormalized" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovieQuerySuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovieQuerySuggestion_textNormalized_key" ON "MovieQuerySuggestion"("textNormalized");

-- CreateIndex
CREATE INDEX "MovieQuerySuggestion_createdAt_idx" ON "MovieQuerySuggestion"("createdAt");
