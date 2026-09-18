-- CreateTable
CREATE TABLE "GroupChat" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "chatId" TEXT NOT NULL,
    "title" TEXT,
    "filterMemberUserIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupChat_chatId_key" ON "GroupChat"("chatId");

-- CreateIndex
CREATE INDEX "GroupChat_groupId_updatedAt_idx" ON "GroupChat"("groupId", "updatedAt");

-- AddForeignKey
ALTER TABLE "GroupChat" ADD CONSTRAINT "GroupChat_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UserGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
