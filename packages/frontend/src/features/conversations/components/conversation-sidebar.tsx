import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ConversationListItem } from "@/features/conversations/components/conversation-list-item";
import type { UserConversationSummaryResponse } from "@/features/conversations/dto/user-conversation.dto";
import { UserConversationService } from "@/features/conversations/services/user-conversation.service";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export interface ConversationSidebarProps {
  activeConversationId: number;
  refreshKey?: number;
  onActiveConversationDeleted?: () => void;
}

class ConversationSidebarUtils {
  static sortByUpdatedAtDesc(
    conversations: UserConversationSummaryResponse[],
  ): UserConversationSummaryResponse[] {
    const sortedConversations = [...conversations];

    sortedConversations.sort((left, right) => {
      const leftTime = new Date(left.updatedAt).getTime();
      const rightTime = new Date(right.updatedAt).getTime();

      return rightTime - leftTime;
    });

    return sortedConversations;
  }

  static replaceConversation(
    conversations: UserConversationSummaryResponse[],
    updatedConversation: UserConversationSummaryResponse,
  ): UserConversationSummaryResponse[] {
    return conversations.map((conversation) => {
      const isSameConversation = conversation.id === updatedConversation.id;
      if (isSameConversation) {
        return updatedConversation;
      }

      return conversation;
    });
  }

  static removeConversation(
    conversations: UserConversationSummaryResponse[],
    conversationId: number,
  ): UserConversationSummaryResponse[] {
    return conversations.filter((conversation) => {
      const isTargetConversation = conversation.id === conversationId;
      return !isTargetConversation;
    });
  }
}

export function ConversationSidebar({
  activeConversationId,
  refreshKey = 0,
  onActiveConversationDeleted,
}: ConversationSidebarProps) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<
    UserConversationSummaryResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const activeFetchIdRef = useRef(0);

  const fetchConversations = useCallback(async () => {
    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    setIsLoading(true);
    setHasLoadError(false);

    console.info("[ConversationSidebar] loading conversations");

    try {
      const response = await UserConversationService.listConversations();
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      const sortedConversations =
        ConversationSidebarUtils.sortByUpdatedAtDesc(response);
      setConversations(sortedConversations);

      console.info("[ConversationSidebar] conversations loaded", {
        count: sortedConversations.length,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      console.error("[ConversationSidebar] failed to load conversations", {
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
  }, []);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations, refreshKey]);

  function handleOpenConversation(conversationId: number) {
    const isAlreadyActive = conversationId === activeConversationId;
    if (isAlreadyActive) {
      return;
    }

    const targetPath = `/conversations/${conversationId}`;
    navigate(targetPath);
  }

  async function handleRenameConversation(
    conversationId: number,
    title: string,
  ) {
    setIsMutating(true);

    try {
      const updatedConversation = await UserConversationService.updateTitle(
        conversationId,
        title,
      );
      const nextConversations = ConversationSidebarUtils.replaceConversation(
        conversations,
        updatedConversation,
      );
      const sortedConversations =
        ConversationSidebarUtils.sortByUpdatedAtDesc(nextConversations);
      setConversations(sortedConversations);

      console.info("[ConversationSidebar] conversation renamed", {
        conversationId,
      });
    } catch (error) {
      console.error("[ConversationSidebar] failed to rename conversation", {
        conversationId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteConversation(conversationId: number) {
    setIsMutating(true);

    try {
      await UserConversationService.delete(conversationId);
      const nextConversations = ConversationSidebarUtils.removeConversation(
        conversations,
        conversationId,
      );
      setConversations(nextConversations);

      console.info("[ConversationSidebar] conversation deleted", {
        conversationId,
      });

      const isActiveConversation = conversationId === activeConversationId;
      if (isActiveConversation && onActiveConversationDeleted) {
        onActiveConversationDeleted();
      }
    } catch (error) {
      console.error("[ConversationSidebar] failed to delete conversation", {
        conversationId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  function handleRetry() {
    void fetchConversations();
  }

  const hasConversations = conversations.length > 0;
  const shouldShowEmptyState = !isLoading && !hasLoadError && !hasConversations;

  return (
    <aside
      className="flex w-72 shrink-0 flex-col border-r border-border/50 bg-card/40"
      aria-label="Conversation history"
    >
      <div className="border-b border-border/50 p-3">
        <Button type="button" variant="outline" className="w-full" asChild>
          <Link to="/">New conversation</Link>
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
        {isLoading && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        )}

        {hasLoadError && !isLoading && (
          <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load conversations.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        )}

        {shouldShowEmptyState && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No conversations yet.
          </p>
        )}

        {hasConversations && !isLoading && !hasLoadError && (
          <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <li key={conversation.id}>
                  <ConversationListItem
                    conversation={conversation}
                    isActive={isActive}
                    isDisabled={isMutating}
                    onOpen={handleOpenConversation}
                    onRename={handleRenameConversation}
                    onDelete={handleDeleteConversation}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
