import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConversationTitleUtils } from "@/features/conversations/utils/conversation-title.utils";
import { SocialConfirmDialog } from "@/features/social/components/social-confirm-dialog";
import {
  GroupChatConstants,
  type GroupChatSummaryResponse,
} from "@/features/social/dto/group-chats.dto";
import { GroupChatListUtils } from "@/features/social/utils/group-chat-list.utils";
import { cn } from "@/lib/utils";

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
  const displayTitle = GroupChatListUtils.formatDisplayTitle(
    chat.title,
    chat.updatedAt,
  );
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
    "group flex items-center gap-2 rounded-md border border-transparent px-2 py-2 transition-colors",
    isActive && "border-border bg-accent/60",
    !isActive && "hover:bg-accent/40",
  );

  return (
    <>
      <div className={itemClassName}>
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
            className="h-8 flex-1"
          />
        ) : (
          <button
            type="button"
            onClick={handleOpenChat}
            onDoubleClick={startEditing}
            disabled={areActionsDisabled}
            className="min-w-0 flex-1 text-left"
          >
            <span className="block truncate text-sm font-medium">
              {displayTitle}
            </span>
          </button>
        )}

        <div className="flex shrink-0 items-center gap-0.5">
          {isRenaming ? (
            <Loader2
              className="h-4 w-4 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Rename chat"
                disabled={areActionsDisabled || isEditing}
                onClick={startEditing}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                aria-label="Delete chat"
                disabled={areActionsDisabled || isEditing}
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
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
