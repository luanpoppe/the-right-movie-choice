import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/context/AuthContext";
import { GroupDetailTabs } from "@/features/social/components/group-detail-tabs";
import { SocialConfirmDialog } from "@/features/social/components/social-confirm-dialog";
import type {
  GroupFriendSuggestionResponse,
  UpdateUserGroupDTO,
  UserGroupListItemResponse,
} from "@/features/social/dto/user-groups.dto";
import { UserGroupConstants } from "@/features/social/dto/user-groups.dto";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { SocialApiErrorUtils } from "@/features/social/utils/social-api-error.utils";
import { cn } from "@/lib/utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

const GROUP_UPDATED_TOAST = "Group updated successfully.";
const GROUP_DELETED_TOAST = "Group deleted successfully.";
const GROUP_LEFT_TOAST = "You left the group.";
const INVITE_SENT_TOAST = "Invite sent.";

export interface GroupDetailPanelProps {
  groupId: string;
}

export class GroupDetailPanelUtils {
  static parseGroupId(groupId: string): number | null {
    const parsedId = Number(groupId);
    const isValidId = Number.isInteger(parsedId) && parsedId > 0;
    if (!isValidId) {
      return null;
    }

    return parsedId;
  }

  static parseUserIdFromAccessToken(accessToken: string | null): number | null {
    if (!accessToken) {
      return null;
    }

    const parts = accessToken.split(".");
    const hasValidStructure = parts.length === 3;
    if (!hasValidStructure) {
      return null;
    }

    try {
      const payloadPart = parts[1];
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const paddingLength = (4 - (base64.length % 4)) % 4;
      const paddedBase64 = base64.padEnd(base64.length + paddingLength, "=");
      const json = atob(paddedBase64);
      const payload = JSON.parse(json) as { sub?: string };
      const sub = payload.sub;
      if (!sub) {
        return null;
      }

      const userId = Number(sub);
      const isValidUserId = Number.isInteger(userId) && userId > 0;
      if (!isValidUserId) {
        return null;
      }

      return userId;
    } catch {
      return null;
    }
  }

  static findGroupById(
    groups: UserGroupListItemResponse[],
    groupId: number,
  ): UserGroupListItemResponse | undefined {
    return groups.find((group) => group.id === groupId);
  }

  static buildUpdatePayload(
    name: string,
    description: string,
  ): UpdateUserGroupDTO {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const payload: UpdateUserGroupDTO = { name: trimmedName };

    const hasDescription = trimmedDescription.length > 0;
    if (hasDescription) {
      payload.description = trimmedDescription;
      return payload;
    }

    payload.description = null;
    return payload;
  }

  static formatMemberCount(memberCount: number): string {
    const isSingular = memberCount === 1;
    if (isSingular) {
      return "1 member";
    }

    return `${memberCount} members`;
  }

  static getSendInviteErrorMessage(error: unknown): string {
    return SocialApiErrorUtils.getConflictOrGenericErrorMessage(error);
  }
}

export function GroupDetailPanel({ groupId }: GroupDetailPanelProps) {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const currentUserId =
    GroupDetailPanelUtils.parseUserIdFromAccessToken(accessToken);
  const parsedGroupId = GroupDetailPanelUtils.parseGroupId(groupId);

  const [group, setGroup] = useState<UserGroupListItemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [invitingSuggestionId, setInvitingSuggestionId] = useState<
    number | null
  >(null);

  const [suggestions, setSuggestions] = useState<
    GroupFriendSuggestionResponse[]
  >([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasSuggestionsError, setHasSuggestionsError] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const activeFetchIdRef = useRef(0);
  const activeSuggestionsFetchIdRef = useRef(0);

  const fetchGroup = useCallback(async () => {
    if (parsedGroupId === null) {
      setGroup(null);
      setIsNotFound(true);
      setIsLoading(false);
      setHasLoadError(false);
      return;
    }

    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    setIsLoading(true);
    setHasLoadError(false);
    setIsNotFound(false);

    console.info("[GroupDetailPanel] loading group", { groupId: parsedGroupId });

    try {
      const groups = await UserGroupsService.listGroups();
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      const matchedGroup = GroupDetailPanelUtils.findGroupById(
        groups,
        parsedGroupId,
      );
      const groupWasFound = matchedGroup !== undefined;
      if (!groupWasFound) {
        setGroup(null);
        setIsNotFound(true);

        console.info("[GroupDetailPanel] group not found", {
          groupId: parsedGroupId,
        });
        return;
      }

      setGroup(matchedGroup);
      setEditName(matchedGroup.name);
      setEditDescription(matchedGroup.description ?? "");

      console.info("[GroupDetailPanel] group loaded", {
        groupId: matchedGroup.id,
        name: matchedGroup.name,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      console.error("[GroupDetailPanel] failed to load group", {
        groupId: parsedGroupId,
        error,
      });
      setHasLoadError(true);
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      const isCurrentFetch = fetchId === activeFetchIdRef.current;
      if (isCurrentFetch) {
        setIsLoading(false);
      }
    }
  }, [parsedGroupId]);

  const fetchSuggestions = useCallback(async () => {
    if (parsedGroupId === null) {
      return;
    }

    const fetchId = activeSuggestionsFetchIdRef.current + 1;
    activeSuggestionsFetchIdRef.current = fetchId;

    setIsLoadingSuggestions(true);
    setHasSuggestionsError(false);

    console.info("[GroupDetailPanel] loading suggestions", {
      groupId: parsedGroupId,
    });

    try {
      const response = await UserGroupsService.listSuggestions(parsedGroupId);
      const isStaleFetch = fetchId !== activeSuggestionsFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      setSuggestions(response);

      console.info("[GroupDetailPanel] suggestions loaded", {
        groupId: parsedGroupId,
        count: response.length,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeSuggestionsFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      setSuggestions([]);
      setHasSuggestionsError(true);

      console.error("[GroupDetailPanel] failed to load suggestions", {
        groupId: parsedGroupId,
        error,
      });
    } finally {
      const isCurrentFetch = fetchId === activeSuggestionsFetchIdRef.current;
      if (isCurrentFetch) {
        setIsLoadingSuggestions(false);
      }
    }
  }, [parsedGroupId]);

  useEffect(() => {
    void fetchGroup();
  }, [fetchGroup]);

  useEffect(() => {
    if (!group) {
      return;
    }

    void fetchSuggestions();
  }, [group, fetchSuggestions]);

  function handleRetry() {
    void fetchGroup();
  }

  function handleRetrySuggestions() {
    void fetchSuggestions();
  }

  async function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!group || parsedGroupId === null) {
      return;
    }

    const payload = GroupDetailPanelUtils.buildUpdatePayload(
      editName,
      editDescription,
    );

    setIsUpdating(true);

    console.info("[GroupDetailPanel] updating group", {
      groupId: parsedGroupId,
      name: payload.name,
    });

    try {
      const updatedGroup = await UserGroupsService.update(
        parsedGroupId,
        payload,
      );
      const nextGroup: UserGroupListItemResponse = {
        ...group,
        name: updatedGroup.name,
        description: updatedGroup.description,
      };
      setGroup(nextGroup);
      setEditName(updatedGroup.name);
      setEditDescription(updatedGroup.description ?? "");
      toast.success(GROUP_UPDATED_TOAST);

      console.info("[GroupDetailPanel] group updated", {
        groupId: parsedGroupId,
      });
    } catch (error) {
      console.error("[GroupDetailPanel] failed to update group", {
        groupId: parsedGroupId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!group || parsedGroupId === null) {
      return;
    }

    const trimmedEmail = inviteEmail.trim();
    const isEmailEmpty = trimmedEmail.length === 0;
    if (isEmailEmpty) {
      return;
    }

    setIsSendingInvite(true);

    console.info("[GroupDetailPanel] sending invite", {
      groupId: parsedGroupId,
      email: trimmedEmail,
    });

    try {
      await UserGroupsService.sendInvite(parsedGroupId, {
        email: trimmedEmail,
      });
      toast.success(INVITE_SENT_TOAST);
      setInviteEmail("");

      console.info("[GroupDetailPanel] invite sent", {
        groupId: parsedGroupId,
        email: trimmedEmail,
      });
    } catch (error) {
      const errorMessage =
        GroupDetailPanelUtils.getSendInviteErrorMessage(error);

      console.error("[GroupDetailPanel] failed to send invite", {
        groupId: parsedGroupId,
        email: trimmedEmail,
        error,
      });
      toast.error(errorMessage);
    } finally {
      setIsSendingInvite(false);
    }
  }

  async function handleInviteSuggestion(
    suggestion: GroupFriendSuggestionResponse,
  ) {
    if (!group || parsedGroupId === null) {
      return;
    }

    setInvitingSuggestionId(suggestion.id);

    console.info("[GroupDetailPanel] inviting suggested friend", {
      groupId: parsedGroupId,
      email: suggestion.email,
      suggestionId: suggestion.id,
    });

    try {
      await UserGroupsService.sendInvite(parsedGroupId, {
        email: suggestion.email,
      });
      toast.success(INVITE_SENT_TOAST);

      console.info("[GroupDetailPanel] suggested friend invited", {
        groupId: parsedGroupId,
        email: suggestion.email,
      });
    } catch (error) {
      const errorMessage =
        GroupDetailPanelUtils.getSendInviteErrorMessage(error);

      console.error("[GroupDetailPanel] failed to invite suggested friend", {
        groupId: parsedGroupId,
        email: suggestion.email,
        error,
      });
      toast.error(errorMessage);
    } finally {
      setInvitingSuggestionId(null);
    }
  }

  function handleOpenDeleteDialog() {
    setIsDeleteDialogOpen(true);
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    setIsDeleteDialogOpen(open);
  }

  function handleOpenLeaveDialog() {
    setIsLeaveDialogOpen(true);
  }

  function handleLeaveDialogOpenChange(open: boolean) {
    setIsLeaveDialogOpen(open);
  }

  async function handleConfirmDeleteGroup() {
    if (!group || parsedGroupId === null) {
      return;
    }

    setIsDeleting(true);

    console.info("[GroupDetailPanel] deleting group", {
      groupId: parsedGroupId,
    });

    try {
      await UserGroupsService.delete(parsedGroupId);
      toast.success(GROUP_DELETED_TOAST);
      setIsDeleteDialogOpen(false);
      navigate("/social");

      console.info("[GroupDetailPanel] group deleted", {
        groupId: parsedGroupId,
      });
    } catch (error) {
      console.error("[GroupDetailPanel] failed to delete group", {
        groupId: parsedGroupId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleConfirmLeaveGroup() {
    if (!group || parsedGroupId === null) {
      return;
    }

    setIsLeaving(true);

    console.info("[GroupDetailPanel] leaving group", {
      groupId: parsedGroupId,
    });

    try {
      await UserGroupsService.leaveGroup(parsedGroupId);
      toast.success(GROUP_LEFT_TOAST);
      setIsLeaveDialogOpen(false);
      navigate("/social");

      console.info("[GroupDetailPanel] left group", {
        groupId: parsedGroupId,
      });
    } catch (error) {
      console.error("[GroupDetailPanel] failed to leave group", {
        groupId: parsedGroupId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      setIsLeaving(false);
    }
  }

  const textareaClassName = cn(
    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  );

  if (isLoading) {
    return (
      <div>
        <Link to="/social" className="text-primary hover:underline">
          Back to Social
        </Link>
        <p className="mt-8 text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (hasLoadError) {
    return (
      <div>
        <Link to="/social" className="text-primary hover:underline">
          Back to Social
        </Link>
        <div className="mt-8 flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Could not load this group.</p>
          <Button type="button" variant="outline" onClick={handleRetry}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (isNotFound || !group) {
    return (
      <div>
        <Link to="/social" className="text-primary hover:underline">
          Back to Social
        </Link>
        <div className="mt-8 flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">
            Group not found or you do not have access.
          </p>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId !== null && group.ownerId === currentUserId;
  const memberCountLabel = GroupDetailPanelUtils.formatMemberCount(
    group.memberCount,
  );
  const hasSuggestions = suggestions.length > 0;
  const deleteDialogDescription = `Are you sure you want to delete "${group.name}"? This cannot be undone.`;
  const leaveDialogDescription = `Are you sure you want to leave "${group.name}"?`;

  const detailsContent = (
    <>
      {isOwner && (
        <form
          onSubmit={handleUpdateSubmit}
          className="space-y-4 rounded-lg border border-border/50 bg-card/50 p-4"
        >
          <h2 className="text-lg font-semibold">Edit group</h2>

          <div className="space-y-2">
            <Label htmlFor="edit-group-name">Name</Label>
            <Input
              id="edit-group-name"
              name="name"
              type="text"
              required
              maxLength={UserGroupConstants.MAX_GROUP_NAME_LENGTH}
              disabled={isUpdating}
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-group-description">
              Description (optional)
            </Label>
            <textarea
              id="edit-group-description"
              name="description"
              maxLength={UserGroupConstants.MAX_GROUP_DESCRIPTION_LENGTH}
              disabled={isUpdating}
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              className={textareaClassName}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleOpenDeleteDialog}
              disabled={isUpdating}
            >
              Delete group
            </Button>
          </div>
        </form>
      )}

      {!isOwner && (
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenLeaveDialog}
          >
            Leave group
          </Button>
        </div>
      )}

      <section className="space-y-4 rounded-lg border border-border/50 bg-card/50 p-4">
        <h2 className="text-lg font-semibold">Invite by email</h2>

        <form
          onSubmit={handleInviteSubmit}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              name="email"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              disabled={isSendingInvite}
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={isSendingInvite}>
            {isSendingInvite ? "Sending..." : "Send invite"}
          </Button>
        </form>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Suggested friends</h3>

          {isLoadingSuggestions && (
            <p className="text-sm text-muted-foreground">Loading suggestions...</p>
          )}

          {hasSuggestionsError && !isLoadingSuggestions && (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">
                Could not load suggestions.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRetrySuggestions}
              >
                Try again
              </Button>
            </div>
          )}

          {!hasSuggestionsError &&
            !isLoadingSuggestions &&
            !hasSuggestions && (
            <p className="text-sm text-muted-foreground">
              No suggestions available.
            </p>
          )}

          {hasSuggestions && !isLoadingSuggestions && (
            <ul className="space-y-2">
              {suggestions.map((suggestion) => {
                const isInvitingThisSuggestion =
                  invitingSuggestionId === suggestion.id;
                const inviteButtonLabel = isInvitingThisSuggestion
                  ? "Inviting..."
                  : `Invite ${suggestion.name}`;

                return (
                  <li
                    key={suggestion.id}
                    className="flex items-center justify-between gap-4 rounded-md border border-border/50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{suggestion.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isInvitingThisSuggestion}
                      onClick={() => handleInviteSuggestion(suggestion)}
                    >
                      {inviteButtonLabel}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <SocialConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        title="Delete group"
        description={deleteDialogDescription}
        onConfirm={handleConfirmDeleteGroup}
        isConfirming={isDeleting}
        confirmLabel="Delete"
      />

      <SocialConfirmDialog
        open={isLeaveDialogOpen}
        onOpenChange={handleLeaveDialogOpenChange}
        title="Leave group"
        description={leaveDialogDescription}
        onConfirm={handleConfirmLeaveGroup}
        isConfirming={isLeaving}
        confirmLabel="Leave"
      />
    </>
  );

  return (
    <div className="space-y-8">
      <Link to="/social" className="text-primary hover:underline">
        Back to Social
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{group.name}</h1>
        {group.description && (
          <p className="text-muted-foreground">{group.description}</p>
        )}
        <p className="text-sm text-muted-foreground">{memberCountLabel}</p>
        {isOwner && (
          <p className="text-sm font-medium text-primary">You are the owner</p>
        )}
      </div>

      <GroupDetailTabs groupId={group.id} detailsContent={detailsContent} />
    </div>
  );
}
