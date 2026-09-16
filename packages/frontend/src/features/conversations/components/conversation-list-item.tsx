import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserConversationConstants } from "@/features/conversations/dto/user-conversation.dto";
import type { UserConversationSummaryResponse } from "@/features/conversations/dto/user-conversation.dto";
import { ConversationTitleUtils } from "@/features/conversations/utils/conversation-title.utils";
import { cn } from "@/lib/utils";
import { ConversationDeleteDialog } from "./conversation-delete-dialog";

interface ConversationListItemProps {
  conversation: UserConversationSummaryResponse;
  isActive?: boolean;
  isDisabled?: boolean;
  onOpen: (conversationId: number) => void;
  onRename: (conversationId: number, title: string) => Promise<void>;
  onDelete: (conversationId: number) => Promise<void>;
}

export function ConversationListItem({
  conversation,
  isActive = false,
  isDisabled = false,
  onOpen,
  onRename,
  onDelete,
}: ConversationListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversationId = conversation.id;
  const displayTitle = ConversationTitleUtils.formatDisplayTitle(
    conversation.title,
    conversation.updatedAt,
  );
  const areActionsDisabled = isDisabled || isRenaming || isDeleting;

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

    const initialDraft =
      conversation.title === null ? "" : conversation.title.trim();
    setDraftTitle(initialDraft);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraftTitle("");
  }

  async function submitRename() {
    const shouldSkip = ConversationTitleUtils.shouldSkipRename(
      conversation.title,
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
      await onRename(conversationId, normalizedTitle);
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

  function handleOpenConversation() {
    if (areActionsDisabled || isEditing) {
      return;
    }

    onOpen(conversationId);
  }

  function handleDeleteClick() {
    if (areActionsDisabled) {
      return;
    }

    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    try {
      await onDelete(conversationId);
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
            maxLength={UserConversationConstants.MAX_TITLE_LENGTH}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={() => void submitRename()}
            disabled={isRenaming}
            aria-label="Conversation title"
            className="h-8 flex-1"
          />
        ) : (
          <button
            type="button"
            onClick={handleOpenConversation}
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
                aria-label="Rename conversation"
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
                aria-label="Delete conversation"
                disabled={areActionsDisabled || isEditing}
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <ConversationDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        conversationTitle={displayTitle}
      />
    </>
  );
}
