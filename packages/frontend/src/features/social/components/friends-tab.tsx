import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import type { UserPublicResponse } from "../dto/friendship.dto";
import { FriendshipService } from "../services/friendship.service";
import { AddFriendForm } from "./add-friend-form";
import { SocialConfirmDialog } from "./social-confirm-dialog";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export class FriendsTabUtils {
  static removeFriendFromList(
    friends: UserPublicResponse[],
    userId: number,
  ): UserPublicResponse[] {
    return friends.filter((friend) => {
      const isTargetFriend = friend.id === userId;
      return !isTargetFriend;
    });
  }
}

export function FriendsTab() {
  const [friends, setFriends] = useState<UserPublicResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [friendToRemove, setFriendToRemove] =
    useState<UserPublicResponse | null>(null);
  const activeFetchIdRef = useRef(0);

  const fetchFriends = useCallback(async () => {
    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    setIsLoading(true);
    setHasLoadError(false);

    console.info("[FriendsTab] loading friends");

    try {
      const response = await FriendshipService.listFriends();
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      setFriends(response);

      console.info("[FriendsTab] friends loaded", {
        count: response.length,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      console.error("[FriendsTab] failed to load friends", { error });
      setHasLoadError(true);
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      const isCurrentFetch = fetchId === activeFetchIdRef.current;
      if (isCurrentFetch) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchFriends();
  }, [fetchFriends]);

  function handleFriendSent() {
    void fetchFriends();
  }

  function handleRetry() {
    void fetchFriends();
  }

  function handleOpenRemoveDialog(friend: UserPublicResponse) {
    setFriendToRemove(friend);
  }

  function handleRemoveDialogOpenChange(open: boolean) {
    if (open) {
      return;
    }

    setFriendToRemove(null);
  }

  async function handleConfirmRemoveFriend() {
    if (!friendToRemove) {
      return;
    }

    const userId = friendToRemove.id;
    setIsRemoving(true);

    try {
      await FriendshipService.removeFriend(userId);
      const nextFriends = FriendsTabUtils.removeFriendFromList(
        friends,
        userId,
      );
      setFriends(nextFriends);
      setFriendToRemove(null);

      console.info("[FriendsTab] friend removed", { userId });
    } catch (error) {
      console.error("[FriendsTab] failed to remove friend", {
        userId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      setIsRemoving(false);
    }
  }

  const hasFriends = friends.length > 0;
  const shouldShowEmptyState = !isLoading && !hasLoadError && !hasFriends;
  const isRemoveDialogOpen = friendToRemove !== null;

  const removeDialogDescription = friendToRemove
    ? `Are you sure you want to remove ${friendToRemove.name} from your friends?`
    : "";

  return (
    <div className="space-y-8">
      <AddFriendForm onSent={handleFriendSent} />

      {isLoading && (
        <p className="text-center text-muted-foreground">Loading...</p>
      )}

      {hasLoadError && !isLoading && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Could not load your friends.</p>
          <Button type="button" variant="outline" onClick={handleRetry}>
            Try again
          </Button>
        </div>
      )}

      {shouldShowEmptyState && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">
            You do not have any friends yet.
          </p>
        </div>
      )}

      {hasFriends && !isLoading && !hasLoadError && (
        <ul className="mx-auto flex max-w-2xl flex-col gap-4">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{friend.name}</p>
                <p className="text-sm text-muted-foreground">{friend.email}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenRemoveDialog(friend)}
              >
                Remove friend
              </Button>
            </li>
          ))}
        </ul>
      )}

      <SocialConfirmDialog
        open={isRemoveDialogOpen}
        onOpenChange={handleRemoveDialogOpenChange}
        title="Remove friend"
        description={removeDialogDescription}
        onConfirm={handleConfirmRemoveFriend}
        isConfirming={isRemoving}
        confirmLabel="Remove"
      />
    </div>
  );
}
