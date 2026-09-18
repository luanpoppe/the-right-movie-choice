import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import type {
  IncomingFriendRequestResponse,
  OutgoingFriendRequestResponse,
} from "@/features/social/dto/friendship.dto";
import type { IncomingGroupInviteResponse } from "@/features/social/dto/user-groups.dto";
import { FriendshipService } from "@/features/social/services/friendship.service";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { SocialApiErrorUtils } from "@/features/social/utils/social-api-error.utils";

const GENERIC_ERROR_TOAST = SocialApiErrorUtils.getGenericErrorMessage();

const EMPTY_INCOMING_MESSAGE = "You have no incoming friend requests.";
const EMPTY_OUTGOING_MESSAGE = "You have no outgoing friend requests.";
const EMPTY_GROUP_INVITES_MESSAGE = "You have no group invites.";
const SECTION_LOAD_ERROR_MESSAGE = "Could not load this section.";

export class RequestsTabUtils {
  static formatUserDisplayName(user: { name: string; email: string }): string {
    return `${user.name} (${user.email})`;
  }
}

export function RequestsTab() {
  const [incomingRequests, setIncomingRequests] = useState<
    IncomingFriendRequestResponse[]
  >([]);
  const [outgoingRequests, setOutgoingRequests] = useState<
    OutgoingFriendRequestResponse[]
  >([]);
  const [groupInvites, setGroupInvites] = useState<
    IncomingGroupInviteResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [hasIncomingLoadError, setHasIncomingLoadError] = useState(false);
  const [hasOutgoingLoadError, setHasOutgoingLoadError] = useState(false);
  const [hasGroupInvitesLoadError, setHasGroupInvitesLoadError] =
    useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const activeFetchIdRef = useRef(0);

  const fetchRequests = useCallback(async () => {
    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    setIsLoading(true);
    setHasLoadError(false);
    setHasIncomingLoadError(false);
    setHasOutgoingLoadError(false);
    setHasGroupInvitesLoadError(false);

    console.info("[RequestsTab] loading requests");

    const incomingPromise = FriendshipService.listIncomingFriendRequests();
    const outgoingPromise = FriendshipService.listOutgoingFriendRequests();
    const groupInvitesPromise = UserGroupsService.listIncomingInvites();
    const settledResults = await Promise.allSettled([
      incomingPromise,
      outgoingPromise,
      groupInvitesPromise,
    ]);

    const isStaleFetch = fetchId !== activeFetchIdRef.current;
    if (isStaleFetch) {
      return;
    }

    const incomingResult = settledResults[0];
    const outgoingResult = settledResults[1];
    const groupInvitesResult = settledResults[2];

    let incomingFailed = false;
    let outgoingFailed = false;
    let groupInvitesFailed = false;

    if (incomingResult.status === "fulfilled") {
      setIncomingRequests(incomingResult.value);
    } else {
      incomingFailed = true;
      setIncomingRequests([]);
      setHasIncomingLoadError(true);
      console.error("[RequestsTab] failed to load incoming friend requests", {
        error: incomingResult.reason,
      });
    }

    if (outgoingResult.status === "fulfilled") {
      setOutgoingRequests(outgoingResult.value);
    } else {
      outgoingFailed = true;
      setOutgoingRequests([]);
      setHasOutgoingLoadError(true);
      console.error("[RequestsTab] failed to load outgoing friend requests", {
        error: outgoingResult.reason,
      });
    }

    if (groupInvitesResult.status === "fulfilled") {
      setGroupInvites(groupInvitesResult.value);
    } else {
      groupInvitesFailed = true;
      setGroupInvites([]);
      setHasGroupInvitesLoadError(true);
      console.error("[RequestsTab] failed to load group invites", {
        error: groupInvitesResult.reason,
      });
    }

    const allSectionsFailed =
      incomingFailed && outgoingFailed && groupInvitesFailed;
    if (allSectionsFailed) {
      setHasLoadError(true);
      toast.error(GENERIC_ERROR_TOAST);
    } else {
      const incomingCount =
        incomingResult.status === "fulfilled" ? incomingResult.value.length : 0;
      const outgoingCount =
        outgoingResult.status === "fulfilled" ? outgoingResult.value.length : 0;
      const groupInviteCount =
        groupInvitesResult.status === "fulfilled"
          ? groupInvitesResult.value.length
          : 0;

      console.info("[RequestsTab] requests loaded", {
        incomingCount,
        outgoingCount,
        groupInviteCount,
        incomingFailed,
        outgoingFailed,
        groupInvitesFailed,
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  async function runMutation(
    action: () => Promise<void>,
    successMessage: string,
    logLabel: string,
  ) {
    setIsMutating(true);

    try {
      await action();
      toast.success(successMessage);
      await fetchRequests();

      console.info(`[RequestsTab] ${logLabel}`);
    } catch (error) {
      const errorMessage =
        SocialApiErrorUtils.getConflictOrGenericErrorMessage(error);

      console.error(`[RequestsTab] failed to ${logLabel}`, { error });
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }

  function handleRetry() {
    void fetchRequests();
  }

  async function handleAcceptFriendRequest(requestId: number) {
    const action = async () => {
      await FriendshipService.acceptFriendRequest(requestId);
    };

    await runMutation(action, "Friend request accepted.", "accept friend request");
  }

  async function handleRejectFriendRequest(requestId: number) {
    const action = async () => {
      await FriendshipService.rejectFriendRequest(requestId);
    };

    await runMutation(action, "Friend request rejected.", "reject friend request");
  }

  async function handleCancelFriendRequest(requestId: number) {
    const action = async () => {
      await FriendshipService.cancelFriendRequest(requestId);
    };

    await runMutation(
      action,
      "Friend request cancelled.",
      "cancel friend request",
    );
  }

  async function handleAcceptGroupInvite(inviteId: number) {
    const action = async () => {
      await UserGroupsService.acceptInvite(inviteId);
    };

    await runMutation(action, "Group invite accepted.", "accept group invite");
  }

  async function handleRejectGroupInvite(inviteId: number) {
    const action = async () => {
      await UserGroupsService.rejectInvite(inviteId);
    };

    await runMutation(action, "Group invite rejected.", "reject group invite");
  }

  const hasIncomingRequests = incomingRequests.length > 0;
  const hasOutgoingRequests = outgoingRequests.length > 0;
  const hasGroupInvites = groupInvites.length > 0;

  if (isLoading) {
    return <p className="text-center text-muted-foreground">Loading...</p>;
  }

  if (hasLoadError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">Could not load your requests.</p>
        <Button type="button" variant="outline" onClick={handleRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="incoming-friend-requests-heading">
        <h2
          id="incoming-friend-requests-heading"
          className="mb-4 text-lg font-semibold"
        >
          Incoming friend requests
        </h2>

        {hasIncomingLoadError && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground">{SECTION_LOAD_ERROR_MESSAGE}</p>
            <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        )}

        {!hasIncomingLoadError && !hasIncomingRequests && (
          <p className="text-muted-foreground">{EMPTY_INCOMING_MESSAGE}</p>
        )}

        {!hasIncomingLoadError && hasIncomingRequests && (
          <ul className="space-y-2">
            {incomingRequests.map((request) => {
              const requesterLabel = RequestsTabUtils.formatUserDisplayName(
                request.requester,
              );
              const acceptLabel = `Accept friend request from ${request.requester.name}`;
              const rejectLabel = `Reject friend request from ${request.requester.name}`;

              return (
                <li
                  key={request.id}
                  className="flex flex-col gap-3 rounded-md border border-border/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{requesterLabel}</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isMutating}
                      aria-label={acceptLabel}
                      onClick={() => {
                        void handleAcceptFriendRequest(request.id);
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isMutating}
                      aria-label={rejectLabel}
                      onClick={() => {
                        void handleRejectFriendRequest(request.id);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="outgoing-friend-requests-heading">
        <h2
          id="outgoing-friend-requests-heading"
          className="mb-4 text-lg font-semibold"
        >
          Outgoing friend requests
        </h2>

        {hasOutgoingLoadError && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground">{SECTION_LOAD_ERROR_MESSAGE}</p>
            <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        )}

        {!hasOutgoingLoadError && !hasOutgoingRequests && (
          <p className="text-muted-foreground">{EMPTY_OUTGOING_MESSAGE}</p>
        )}

        {!hasOutgoingLoadError && hasOutgoingRequests && (
          <ul className="space-y-2">
            {outgoingRequests.map((request) => {
              const addresseeLabel = RequestsTabUtils.formatUserDisplayName(
                request.addressee,
              );
              const cancelLabel = `Cancel friend request to ${request.addressee.name}`;

              return (
                <li
                  key={request.id}
                  className="flex flex-col gap-3 rounded-md border border-border/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{addresseeLabel}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isMutating}
                    aria-label={cancelLabel}
                    onClick={() => {
                      void handleCancelFriendRequest(request.id);
                    }}
                  >
                    Cancel
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="group-invites-heading">
        <h2 id="group-invites-heading" className="mb-4 text-lg font-semibold">
          Group invites
        </h2>

        {hasGroupInvitesLoadError && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground">{SECTION_LOAD_ERROR_MESSAGE}</p>
            <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        )}

        {!hasGroupInvitesLoadError && !hasGroupInvites && (
          <p className="text-muted-foreground">{EMPTY_GROUP_INVITES_MESSAGE}</p>
        )}

        {!hasGroupInvitesLoadError && hasGroupInvites && (
          <ul className="space-y-2">
            {groupInvites.map((invite) => {
              const acceptLabel = `Accept invite to ${invite.group.name}`;
              const rejectLabel = `Reject invite to ${invite.group.name}`;

              return (
                <li
                  key={invite.id}
                  className="flex flex-col gap-3 rounded-md border border-border/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="block font-medium">{invite.group.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Invited by {invite.inviter.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isMutating}
                      aria-label={acceptLabel}
                      onClick={() => {
                        void handleAcceptGroupInvite(invite.id);
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isMutating}
                      aria-label={rejectLabel}
                      onClick={() => {
                        void handleRejectGroupInvite(invite.id);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
