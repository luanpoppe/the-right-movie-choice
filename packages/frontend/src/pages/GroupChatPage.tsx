import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Chat } from "@/features/chat";
import { ChatEntity } from "@/features/chat/entities/chat.entity";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ChatHistoryMapperUtils } from "@/features/conversations/utils/chat-history-mapper.utils";
import { GroupChatFilterMembersDialog } from "@/features/social/components/group-chat-filter-members-dialog";
import { GroupChatSidebar } from "@/features/social/components/group-chat-sidebar";
import {
  GroupChatChatIdParamsSchema,
  type GroupChatGetResponse,
  type GroupChatUpdateFilterMembersResponse,
} from "@/features/social/dto/group-chats.dto";
import { useGroupChat } from "@/features/social/hooks/use-group-chat";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { UserMovieEntriesProvider } from "@/features/movies/context/user-movie-entries.context";
import { StringUtils } from "@/utils/string.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export class GroupChatPageUtils {
  static isNotFoundError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
      return false;
    }

    const status = error.response?.status;
    const isNotFound = status === 404;
    return isNotFound;
  }
}

interface GroupChatPageContentProps {
  groupId: number;
  chatId: string;
}

function GroupChatPageContent({ groupId, chatId }: GroupChatPageContentProps) {
  const navigate = useNavigate();
  const [chat, setChat] = useState<GroupChatGetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirectToGroup, setShouldRedirectToGroup] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const activeFetchIdRef = useRef(0);
  const hasCalledInitialRefetchRef = useRef(false);

  const fetchChat = useCallback(async () => {
    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    setIsLoading(true);
    setShouldRedirectToGroup(false);
    setChat(null);

    console.info("[GroupChatPage] loading chat", { groupId, chatId });

    try {
      const response = await GroupChatsService.getByChatId(groupId, chatId);
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      setChat(response);

      console.info("[GroupChatPage] chat loaded", {
        groupId,
        chatId,
        messageCount: response.messages.length,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      const isNotFound = GroupChatPageUtils.isNotFoundError(error);
      if (isNotFound) {
        console.info("[GroupChatPage] chat not found", { groupId, chatId });
        setShouldRedirectToGroup(true);
        return;
      }

      console.error("[GroupChatPage] failed to load chat", {
        groupId,
        chatId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      const isCurrentFetch = fetchId === activeFetchIdRef.current;
      if (isCurrentFetch) {
        setIsLoading(false);
      }
    }
  }, [groupId, chatId]);

  useEffect(() => {
    void fetchChat();
  }, [fetchChat]);

  const initialMessages = useMemo((): ChatEntity => {
    if (!chat) {
      return [];
    }

    const mappedMessages = ChatHistoryMapperUtils.toChatEntity(chat.messages);
    return mappedMessages;
  }, [chat]);

  const {
    messages,
    isLoading: isChatLoading,
    handleSubmit,
    refetch,
    sidebarRefreshKey,
    chatSummary,
  } = useGroupChat({
    groupId,
    chatId,
    initialMessages,
    enabled: true,
  });

  useEffect(() => {
    if (hasCalledInitialRefetchRef.current) {
      return;
    }

    hasCalledInitialRefetchRef.current = true;
    void refetch();
  }, [refetch]);

  const numericChatId = chatSummary?.id ?? chat?.id ?? null;
  const filterMemberUserIds =
    chatSummary?.filterMemberUserIds ?? chat?.filterMemberUserIds ?? [];
  const canOpenFilterDialog = numericChatId !== null;

  function handleReset() {
    navigate("/");
  }

  function handleActiveChatDeleted() {
    const groupPath = `/social/groups/${groupId}`;
    const navigationState = { tab: "chat" };
    navigate(groupPath, { state: navigationState });
  }

  function handleFilterMembersSaved(
    result: GroupChatUpdateFilterMembersResponse,
  ) {
    setChat((currentChat) => {
      if (!currentChat) {
        return currentChat;
      }

      const updatedChat: GroupChatGetResponse = {
        ...currentChat,
        filterMemberUserIds: result.filterMemberUserIds,
        updatedAt: result.updatedAt,
      };

      return updatedChat;
    });

    console.info("[GroupChatPage] filter members updated", {
      groupId,
      chatId,
      memberCount: result.filterMemberUserIds.length,
    });
  }

  function handleOpenFilterDialog() {
    setIsFilterDialogOpen(true);
  }

  function handleFilterDialogOpenChange(open: boolean) {
    setIsFilterDialogOpen(open);
  }

  function handleExcludeWatchedChange() {
    // Group chat watched filter is managed via filter members dialog.
  }

  if (shouldRedirectToGroup) {
    const groupPath = `/social/groups/${groupId}`;
    const navigationState = { tab: "chat" };
    return <Navigate to={groupPath} replace state={navigationState} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-muted-foreground">Could not load this chat.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <GroupChatSidebar
        groupId={groupId}
        activeChatId={chatId}
        refreshKey={sidebarRefreshKey}
        onActiveChatDeleted={handleActiveChatDeleted}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border/50 px-6 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenFilterDialog}
            disabled={!canOpenFilterDialog}
          >
            Watched movies filter
          </Button>
        </div>

        <UserMovieEntriesProvider>
          <Chat
            handleReset={handleReset}
            displayMessages={messages}
            isLoading={isChatLoading}
            handleSubmit={handleSubmit}
            excludeWatched={true}
            onExcludeWatchedChange={handleExcludeWatchedChange}
            hasAccessToken={false}
          />
        </UserMovieEntriesProvider>
      </div>

      {canOpenFilterDialog && numericChatId !== null && (
        <GroupChatFilterMembersDialog
          open={isFilterDialogOpen}
          onOpenChange={handleFilterDialogOpenChange}
          groupId={groupId}
          chatId={numericChatId}
          currentFilterMemberUserIds={filterMemberUserIds}
          onSaved={handleFilterMembersSaved}
        />
      )}
    </div>
  );
}

export function GroupChatPage() {
  const { accessToken } = useAuth();
  const { groupId: groupIdParam, chatId: chatIdParam } = useParams();
  const location = useLocation();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  const loginRedirectPath = `/login?redirect=${location.pathname}`;

  if (!hasAccessToken) {
    return <Navigate to={loginRedirectPath} replace />;
  }

  const parseResult = GroupChatChatIdParamsSchema.safeParse({
    groupId: groupIdParam,
    chatId: chatIdParam,
  });
  const hasValidParams = parseResult.success;

  if (!hasValidParams) {
    return <Navigate to="/social" replace />;
  }

  const groupId = parseResult.data.groupId;
  const chatId = parseResult.data.chatId;

  return <GroupChatPageContent groupId={groupId} chatId={chatId} />;
}
