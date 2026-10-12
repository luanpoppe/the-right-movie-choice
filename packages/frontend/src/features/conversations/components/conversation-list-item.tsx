import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserConversationConstants } from "@/features/conversations/dto/user-conversation.dto";
import type { UserConversationSummaryResponse } from "@/features/conversations/dto/user-conversation.dto";
import { ConversationTitleUtils } from "@/features/conversations/utils/conversation-title.utils";
import { cn, focusRingClassName } from "@/lib/utils";
import { ConversationDeleteDialog } from "./conversation-delete-dialog";

interface ConversationListItemProps {
  conversation: UserConversationSummaryResponse;
  isActive?: boolean;
  isDisabled?: boolean;
  variant?: "row" | "card";
  dense?: boolean;
  onOpen: (conversationId: number) => void;
  onRename: (conversationId: number, title: string) => Promise<void>;
  onDelete: (conversationId: number) => Promise<void>;
}

export function ConversationListItem({
  conversation,
  isActive = false,
  isDisabled = false,
  variant = "row",
  dense = false,
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
  const isCard = variant === "card";
  const trimmedTitle = conversation.title?.trim() ?? "";
  const hasCustomTitle = trimmedTitle.length > 0;
  const displayTitle =
    isCard && !hasCustomTitle
      ? ConversationTitleUtils.NULL_TITLE_LABEL
      : ConversationTitleUtils.formatDisplayTitle(
          conversation.title,
          conversation.updatedAt,
        );
  const updatedLabel = isCard
    ? `Updated ${ConversationTitleUtils.formatUpdatedAt(conversation.updatedAt)}`
    : null;
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
    "group flex items-center transition-colors",
    isCard
      ? cn(
          "border border-border bg-card hover:border-primary/40 hover:bg-secondary/40",
          dense ? "gap-2.5 rounded-lg px-2.5 py-2" : "gap-3 rounded-xl px-4 py-3",
          isActive && "border-primary/40 bg-secondary",
        )
      : cn(
          "gap-2 rounded-lg border border-transparent px-2 py-2",
          isActive ? "border-border bg-secondary" : "hover:bg-secondary",
        ),
  );

  const iconTileClassName = cn(
    "flex shrink-0 items-center justify-center rounded-lg bg-secondary text-primary",
    dense ? "h-8 w-8" : "h-9 w-9",
  );
  const iconGlyphClassName = dense ? "h-3.5 w-3.5" : "h-4 w-4";
  const actionButtonClassName = dense ? "h-7 w-7" : "h-8 w-8";
  const actionIconClassName = dense ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <>
      <div className={itemClassName}>
        {isCard && (
          <span className={iconTileClassName}>
            <MessageSquare className={iconGlyphClassName} aria-hidden />
          </span>
        )}

        <div className="min-w-0 flex-1">
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
              className="h-8 w-full"
            />
          ) : (
            <>
              <button
                type="button"
                onClick={handleOpenConversation}
                onDoubleClick={startEditing}
                disabled={areActionsDisabled}
                className={cn("block w-full min-w-0 rounded text-left", focusRingClassName)}
              >
                <span
                  className={cn(
                    "block truncate",
                    isCard
                      ? "font-display text-sm font-semibold tracking-tight"
                      : "text-sm font-medium",
                  )}
                >
                  {displayTitle}
                </span>
              </button>
              {updatedLabel !== null && (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {updatedLabel}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {isRenaming ? (
            <Loader2
              className={cn(actionIconClassName, "animate-spin text-muted-foreground")}
              aria-hidden
            />
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={actionButtonClassName}
                aria-label="Rename conversation"
                disabled={areActionsDisabled || isEditing}
                onClick={startEditing}
              >
                <Pencil className={actionIconClassName} />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(actionButtonClassName, "text-destructive hover:text-destructive")}
                aria-label="Delete conversation"
                disabled={areActionsDisabled || isEditing}
                onClick={handleDeleteClick}
              >
                <Trash2 className={actionIconClassName} />
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
