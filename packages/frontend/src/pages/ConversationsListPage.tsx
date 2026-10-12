import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ListSkeleton } from "@/components/list-skeleton";
import { Button } from "@/components/ui/button";
import { ConversationListItem } from "@/features/conversations/components/conversation-list-item";
import type { UserConversationSummaryResponse } from "@/features/conversations/dto/user-conversation.dto";
import { UserConversationService } from "@/features/conversations/services/user-conversation.service";
import { useAuth } from "@/features/auth/context/AuthContext";
import { StringUtils } from "@/utils/string.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

const CONVERSATIONS_LOGIN_REDIRECT = "/login?redirect=/conversations";

export class ConversationsListPageUtils {
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

function ConversationsListPageContent() {
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

    console.info("[ConversationsListPage] loading conversations");

    try {
      const response = await UserConversationService.listConversations();
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      const sortedConversations =
        ConversationsListPageUtils.sortByUpdatedAtDesc(response);
      setConversations(sortedConversations);

      console.info("[ConversationsListPage] conversations loaded", {
        count: sortedConversations.length,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      console.error("[ConversationsListPage] failed to load conversations", {
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
  }, [fetchConversations]);

  function handleOpenConversation(conversationId: number) {
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
      const nextConversations = ConversationsListPageUtils.replaceConversation(
        conversations,
        updatedConversation,
      );
      const sortedConversations =
        ConversationsListPageUtils.sortByUpdatedAtDesc(nextConversations);
      setConversations(sortedConversations);

      console.info("[ConversationsListPage] conversation renamed", {
        conversationId,
      });
    } catch (error) {
      console.error("[ConversationsListPage] failed to rename conversation", {
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
      const nextConversations = ConversationsListPageUtils.removeConversation(
        conversations,
        conversationId,
      );
      setConversations(nextConversations);

      console.info("[ConversationsListPage] conversation deleted", {
        conversationId,
      });
    } catch (error) {
      console.error("[ConversationsListPage] failed to delete conversation", {
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
    <div className="mx-auto w-full max-w-[1120px] px-4 py-10 sm:px-6">
      <PageHeader
        title="Conversations"
        description="Browse, rename, and delete your past movie recommendation chats."
        action={
          <Button asChild>
            <Link to="/">New conversation</Link>
          </Button>
        }
      />

      {isLoading && (
        <ListSkeleton
          className="mx-auto max-w-3xl"
          label="Loading your conversations..."
        />
      )}

      {hasLoadError && !isLoading && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">
            Could not load your conversations.
          </p>
          <Button type="button" variant="outline" onClick={handleRetry}>
            Try again
          </Button>
        </div>
      )}

      {shouldShowEmptyState && (
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
            <MessageSquare className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="font-display text-lg font-semibold tracking-tight">
              No conversations yet
            </p>
            <p className="text-sm text-muted-foreground">
              Start a chat and your recommendation history shows up here.
            </p>
          </div>
          <Button asChild>
            <Link to="/">Start a conversation</Link>
          </Button>
        </div>
      )}

      {hasConversations && !isLoading && !hasLoadError && (
        <ul className="mx-auto flex max-w-3xl flex-col gap-2">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <ConversationListItem
                conversation={conversation}
                isDisabled={isMutating}
                variant="card"
                onOpen={handleOpenConversation}
                onRename={handleRenameConversation}
                onDelete={handleDeleteConversation}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ConversationsListPage() {
  const { accessToken } = useAuth();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  if (!hasAccessToken) {
    return <Navigate to={CONVERSATIONS_LOGIN_REDIRECT} replace />;
  }

  return <ConversationsListPageContent />;
}
