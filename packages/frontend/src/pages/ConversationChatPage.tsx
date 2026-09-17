import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import axios from "axios";
import toast from "react-hot-toast";
import { Chat } from "@/features/chat";
import { ChatEntity } from "@/features/chat/entities/chat.entity";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ConversationSidebar } from "@/features/conversations/components/conversation-sidebar";
import {
  UserConversationGetResponseDTO,
  UserConversationIdParamsSchema,
} from "@/features/conversations/dto/user-conversation.dto";
import { useConversationChat } from "@/features/conversations/hooks/use-conversation-chat";
import { UserConversationService } from "@/features/conversations/services/user-conversation.service";
import { ChatHistoryMapperUtils } from "@/features/conversations/utils/chat-history-mapper.utils";
import { ConversationBootstrapUtils } from "@/features/conversations/utils/conversation-bootstrap.utils";
import { UserMovieEntriesProvider } from "@/features/movies/context/user-movie-entries.context";
import { StringUtils } from "@/utils/string.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export class ConversationChatPageUtils {
  static isNotFoundError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
      return false;
    }

    const status = error.response?.status;
    const isNotFound = status === 404;
    return isNotFound;
  }
}

interface ConversationChatPageContentProps {
  conversationId: number;
}

function ConversationChatPageContent({
  conversationId,
}: ConversationChatPageContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversation, setConversation] =
    useState<UserConversationGetResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirectToConversations, setShouldRedirectToConversations] =
    useState(false);
  const activeFetchIdRef = useRef(0);

  const fetchConversation = useCallback(async () => {
    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    setIsLoading(true);
    setShouldRedirectToConversations(false);
    setConversation(null);

    console.info("[ConversationChatPage] loading conversation", {
      conversationId,
    });

    try {
      const response = await UserConversationService.getById(conversationId);
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      setConversation(response);

      console.info("[ConversationChatPage] conversation loaded", {
        conversationId,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      const isNotFound = ConversationChatPageUtils.isNotFoundError(error);
      if (isNotFound) {
        console.info("[ConversationChatPage] conversation not found", {
          conversationId,
        });
        setShouldRedirectToConversations(true);
        return;
      }

      console.error("[ConversationChatPage] failed to load conversation", {
        conversationId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      const isCurrentFetch = fetchId === activeFetchIdRef.current;
      if (isCurrentFetch) {
        setIsLoading(false);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    void fetchConversation();
  }, [fetchConversation]);

  const initialMessages = useMemo((): ChatEntity => {
    if (!conversation) {
      return [];
    }

    const mappedMessages = ChatHistoryMapperUtils.toChatEntity(
      conversation.messages,
    );
    const bootstrap = ConversationBootstrapUtils.readFromLocationState(
      location.state,
    );
    const enrichedMessages = ConversationBootstrapUtils.enrichMessagesWithBootstrap(
      mappedMessages,
      bootstrap,
    );
    return enrichedMessages;
  }, [conversation, location.state]);

  const chatId = conversation?.chatId ?? "";

  const {
    messages,
    isLoading: isChatLoading,
    excludeWatched,
    setExcludeWatched,
    handleSubmit,
    sidebarRefreshKey,
  } = useConversationChat({
    chatId,
    initialMessages,
  });

  function handleReset() {
    navigate("/");
  }

  function handleActiveConversationDeleted() {
    navigate("/");
  }

  if (shouldRedirectToConversations) {
    return <Navigate to="/conversations" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-muted-foreground">
          Could not load this conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <ConversationSidebar
        activeConversationId={conversationId}
        refreshKey={sidebarRefreshKey}
        onActiveConversationDeleted={handleActiveConversationDeleted}
      />

      <UserMovieEntriesProvider>
        <Chat
          handleReset={handleReset}
          displayMessages={messages}
          isLoading={isChatLoading}
          handleSubmit={handleSubmit}
          excludeWatched={excludeWatched}
          onExcludeWatchedChange={setExcludeWatched}
          hasAccessToken={true}
        />
      </UserMovieEntriesProvider>
    </div>
  );
}

export function ConversationChatPage() {
  const { accessToken } = useAuth();
  const { id: idParam } = useParams();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  const loginRedirectPath = `/login?redirect=/conversations/${idParam ?? ""}`;

  if (!hasAccessToken) {
    return <Navigate to={loginRedirectPath} replace />;
  }

  const parseResult = UserConversationIdParamsSchema.safeParse({ id: idParam });
  const hasValidConversationId = parseResult.success;

  if (!hasValidConversationId) {
    return <Navigate to="/conversations" replace />;
  }

  const conversationId = parseResult.data.id;

  return <ConversationChatPageContent conversationId={conversationId} />;
}
