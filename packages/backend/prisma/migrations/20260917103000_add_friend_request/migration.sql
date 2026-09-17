-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" SERIAL NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "addresseeId" INTEGER NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FriendRequest_requesterId_addresseeId_check" CHECK ("requesterId" <> "addresseeId")
);

-- CreateIndex
CREATE INDEX "FriendRequest_requesterId_status_idx" ON "FriendRequest"("requesterId", "status");

-- CreateIndex
CREATE INDEX "FriendRequest_addresseeId_status_idx" ON "FriendRequest"("addresseeId", "status");

-- CreateIndex
CREATE INDEX "FriendRequest_requesterId_addresseeId_createdAt_idx" ON "FriendRequest"("requesterId", "addresseeId", "createdAt");

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
