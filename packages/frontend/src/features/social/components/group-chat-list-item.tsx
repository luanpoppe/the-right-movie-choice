import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConversationTitleUtils } from "@/features/conversations/utils/conversation-title.utils";
import { SocialConfirmDialog } from "@/features/social/components/social-confirm-dialog";
import {
  GroupChatConstants,
  type GroupChatSummaryResponse,
} from "@/features/social/dto/group-chats.dto";
import { GroupChatListUtils } from "@/features/social/utils/group-chat-list.utils";
import { cn, focusRingClassName } from "@/lib/utils";

export interface GroupChatListItemProps {
  chat: GroupChatSummaryResponse;
  isActive?: boolean;
  isDisabled?: boolean;
  onOpen: (chat: GroupChatSummaryResponse) => void;
  onRename: (chatId: number, title: string) => Promise<void>;
  onDelete: (chatId: number) => Promise<void>;
}

export function GroupChatListItem({
  chat,
  isActive = false,
  isDisabled = false,
  onOpen,
  onRename,
  onDelete,
}: GroupChatListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatNumericId = chat.id;
  const displayTitle = GroupChatListUtils.formatTitle(chat.title);
  const updatedLabel = `Updated ${GroupChatListUtils.formatUpdatedAt(
    chat.updatedAt,
  )}`;
  const areActionsDisabled = isDisabled || isRenaming || isDeleting;
  const deleteDialogDescription = `Are you sure you want to delete "${displayTitle}"? This cannot be undone.`;

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  function startEditing() {
    if (areActionsDisabled) {
      return;
    }

    const initialDraft = chat.title === null ? "" : chat.title.trim();
    setDraftTitle(initialDraft);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraftTitle("");
  }

  async function submitRename() {
    const shouldSkip = ConversationTitleUtils.shouldSkipRename(
      chat.title,
      draftTitle,
    );
    if (shouldSkip) {
      cancelEditing();
      return;
    }

    const normalizedTitle =
      ConversationTitleUtils.normalizeRenameValue(draftTitle);

    setIsRenaming(true);
    try {
      await onRename(chatNumericId, normalizedTitle);
      cancelEditing();
    } finally {
      setIsRenaming(false);
    }
  }

  function handleTitleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitRename();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  }

  function handleOpenChat() {
    if (areActionsDisabled || isEditing) {
      return;
    }

    onOpen(chat);
  }

  function handleDeleteClick() {
    if (areActionsDisabled) {
      return;
    }

    setDeleteDialogOpen(true);
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    setDeleteDialogOpen(open);
  }

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    try {
      await onDelete(chatNumericId);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  const itemClassName = cn(
    "group flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 transition-colors hover:border-primary/40 hover:bg-secondary/40",
    isActive && "border-primary/40 bg-secondary",
  );

  return (
    <>
      <div className={itemClassName}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={draftTitle}
              maxLength={GroupChatConstants.MAX_TITLE_LENGTH}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={() => void submitRename()}
              disabled={isRenaming}
              aria-label="Chat title"
              className="h-8 w-full"
            />
          ) : (
            <>
              <button
                type="button"
                onClick={handleOpenChat}
                onDoubleClick={startEditing}
                disabled={areActionsDisabled}
                className={cn("block w-full min-w-0 rounded text-left", focusRingClassName)}
              >
                <span className="block truncate text-sm font-medium">
                  {displayTitle}
                </span>
              </button>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {updatedLabel}
              </span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {isRenaming ? (
            <Loader2
              className="h-3.5 w-3.5 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Rename chat"
                disabled={areActionsDisabled || isEditing}
                onClick={startEditing}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                aria-label="Delete chat"
                disabled={areActionsDisabled || isEditing}
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <SocialConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        title="Delete chat"
        description={deleteDialogDescription}
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        confirmLabel="Delete"
      />
    </>
  );
}
