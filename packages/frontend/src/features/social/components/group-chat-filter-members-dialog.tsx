import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { GroupChatUpdateFilterMembersResponse } from "@/features/social/dto/group-chats.dto";
import { GroupChatInvalidFilterMemberUserIdsResponseSchema } from "@/features/social/dto/group-chats.dto";
import type { UserPublicResponse } from "@/features/social/dto/friendship.dto";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { SocialApiErrorUtils } from "@/features/social/utils/social-api-error.utils";
import { cn } from "@/lib/utils";

const GENERIC_ERROR_TOAST = SocialApiErrorUtils.getGenericErrorMessage();

export interface GroupChatFilterMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  chatId: number;
  currentFilterMemberUserIds: number[];
  onSaved: (result: GroupChatUpdateFilterMembersResponse) => void;
}

export class GroupChatFilterMembersDialogUtils {
  static getInvalidFilterMembersErrorMessage(error: unknown): string | null {
    if (!axios.isAxiosError(error)) {
      return null;
    }

    const statusCode = error.response?.status;
    const isBadRequest = statusCode === 400;
    if (!isBadRequest) {
      return null;
    }

    const responseData = error.response?.data;
    const parseResult =
      GroupChatInvalidFilterMemberUserIdsResponseSchema.safeParse(responseData);
    if (!parseResult.success) {
      return null;
    }

    return parseResult.data.error;
  }

  static areAllMembersSelected(
    members: UserPublicResponse[],
    selectedUserIds: number[],
  ): boolean {
    if (members.length === 0) {
      return false;
    }

    return members.every((member) => selectedUserIds.includes(member.id));
  }

  static toggleSelectAll(
    members: UserPublicResponse[],
    selectedUserIds: number[],
  ): number[] {
    const allSelected = GroupChatFilterMembersDialogUtils.areAllMembersSelected(
      members,
      selectedUserIds,
    );

    if (allSelected) {
      return [];
    }

    const allMemberIds = members.map((member) => member.id);
    return allMemberIds;
  }
}

export function GroupChatFilterMembersDialog({
  open,
  onOpenChange,
  groupId,
  chatId,
  currentFilterMemberUserIds,
  onSaved,
}: GroupChatFilterMembersDialogProps) {
  const [members, setMembers] = useState<UserPublicResponse[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const activeFetchIdRef = useRef(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedUserIds(currentFilterMemberUserIds);

    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;
    setIsLoadingMembers(true);
    setHasLoadError(false);

    async function loadMembers() {
      console.info("[GroupChatFilterMembersDialog] loading members", {
        groupId,
      });

      try {
        const loadedMembers = await UserGroupsService.listMembers(groupId);
        const isStaleResponse = fetchId !== activeFetchIdRef.current;
        if (isStaleResponse) {
          return;
        }

        setMembers(loadedMembers);
        console.info("[GroupChatFilterMembersDialog] members loaded", {
          groupId,
          count: loadedMembers.length,
        });
      } catch (error) {
        const isStaleResponse = fetchId !== activeFetchIdRef.current;
        if (isStaleResponse) {
          return;
        }

        setHasLoadError(true);
        console.error("[GroupChatFilterMembersDialog] failed to load members", {
          groupId,
          error,
        });
        toast.error(GENERIC_ERROR_TOAST);
      } finally {
        const isStaleResponse = fetchId !== activeFetchIdRef.current;
        if (!isStaleResponse) {
          setIsLoadingMembers(false);
        }
      }
    }

    loadMembers();
  }, [open, groupId, currentFilterMemberUserIds]);

  const areAllMembersSelected =
    GroupChatFilterMembersDialogUtils.areAllMembersSelected(
      members,
      selectedUserIds,
    );

  function handleToggleMember(userId: number) {
    const isAlreadySelected = selectedUserIds.includes(userId);
    if (isAlreadySelected) {
      const nextSelectedUserIds = selectedUserIds.filter((id) => id !== userId);
      setSelectedUserIds(nextSelectedUserIds);
      return;
    }

    const nextSelectedUserIds = [...selectedUserIds, userId];
    setSelectedUserIds(nextSelectedUserIds);
  }

  function handleToggleSelectAll() {
    const nextSelectedUserIds =
      GroupChatFilterMembersDialogUtils.toggleSelectAll(
        members,
        selectedUserIds,
      );
    setSelectedUserIds(nextSelectedUserIds);
  }

  async function handleSave() {
    setIsSaving(true);
    console.info("[GroupChatFilterMembersDialog] saving filter members", {
      groupId,
      chatId,
      userIds: selectedUserIds,
    });

    try {
      const updatedChat = await GroupChatsService.updateFilterMembers(
        groupId,
        chatId,
        selectedUserIds,
      );

      console.info("[GroupChatFilterMembersDialog] filter members saved", {
        groupId,
        chatId,
      });
      onSaved(updatedChat);
      onOpenChange(false);
    } catch (error) {
      const invalidFilterMessage =
        GroupChatFilterMembersDialogUtils.getInvalidFilterMembersErrorMessage(
          error,
        );

      if (invalidFilterMessage) {
        console.error(
          "[GroupChatFilterMembersDialog] invalid filter member user ids",
          { groupId, chatId, error },
        );
        toast.error(invalidFilterMessage);
        return;
      }

      console.error(
        "[GroupChatFilterMembersDialog] failed to save filter members",
        { groupId, chatId, error },
      );
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      setIsSaving(false);
    }
  }

  const isActionDisabled = isLoadingMembers || isSaving;
  const selectAllLabel = areAllMembersSelected ? "Deselect all" : "Select all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Watched movies filter</DialogTitle>
          <DialogDescription>
            Select group members whose watched movies should be excluded from
            recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Group members</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleToggleSelectAll}
              disabled={isActionDisabled || members.length === 0}
            >
              {selectAllLabel}
            </Button>
          </div>

          {isLoadingMembers && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {hasLoadError && !isLoadingMembers && (
            <p className="text-sm text-destructive">
              Failed to load members. Try again later.
            </p>
          )}

          {!isLoadingMembers && !hasLoadError && members.length === 0 && (
            <p className="text-sm text-muted-foreground">No members found.</p>
          )}

          {!isLoadingMembers && !hasLoadError && members.length > 0 && (
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {members.map((member) => {
                const isSelected = selectedUserIds.includes(member.id);
                const checkboxId = `filter-member-${member.id}`;

                return (
                  <li key={member.id}>
                    <Label
                      htmlFor={checkboxId}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md border border-border/60 p-3",
                        "hover:bg-muted/40",
                        isActionDisabled && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="checkbox"
                        id={checkboxId}
                        checked={isSelected}
                        onChange={() => handleToggleMember(member.id)}
                        disabled={isActionDisabled}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border border-primary accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">
                          {member.name}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {member.email}
                        </span>
                      </span>
                    </Label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isActionDisabled || hasLoadError}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
