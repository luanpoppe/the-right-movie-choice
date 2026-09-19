import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { GroupChatListItem } from "@/features/social/components/group-chat-list-item";
import type { GroupChatSummaryResponse } from "@/features/social/dto/group-chats.dto";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { GroupChatListUtils } from "@/features/social/utils/group-chat-list.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export interface GroupChatSidebarProps {
  groupId: number;
  activeChatId: string;
  refreshKey?: number;
  onActiveChatDeleted?: () => void;
}

export class GroupChatSidebarUtils {
  static sortByUpdatedAtDesc(
    chats: GroupChatSummaryResponse[],
  ): GroupChatSummaryResponse[] {
    const sortedChats = GroupChatListUtils.sortByUpdatedAtDesc(chats);

    return sortedChats;
  }

  static replaceChat(
    chats: GroupChatSummaryResponse[],
    updatedChat: GroupChatSummaryResponse,
  ): GroupChatSummaryResponse[] {
    return chats.map((chat) => {
      const isSameChat = chat.id === updatedChat.id;
      if (isSameChat) {
        return updatedChat;
      }

      return chat;
    });
  }

  static removeChat(
    chats: GroupChatSummaryResponse[],
    chatId: number,
  ): GroupChatSummaryResponse[] {
    return chats.filter((chat) => {
      const isTargetChat = chat.id === chatId;
      return !isTargetChat;
    });
  }

  static buildChatPath(groupId: number, chatId: string): string {
    const path = `/social/groups/${groupId}/chats/${chatId}`;

    return path;
  }
}

export function GroupChatSidebar({
  groupId,
  activeChatId,
  refreshKey = 0,
  onActiveChatDeleted,
}: GroupChatSidebarProps) {
  const navigate = useNavigate();
  const [chats, setChats] = useState<GroupChatSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const activeFetchIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  const fetchChats = useCallback(
    async (options?: { silent?: boolean }) => {
      const fetchId = activeFetchIdRef.current + 1;
      activeFetchIdRef.current = fetchId;

      const isSilentRefresh = options?.silent === true;
      if (!isSilentRefresh) {
        setIsLoading(true);
      }
      setHasLoadError(false);

      console.info("[GroupChatSidebar] loading chats", { groupId });

      try {
        const response = await GroupChatsService.list(groupId);
        const isStaleFetch = fetchId !== activeFetchIdRef.current;
        if (isStaleFetch) {
          return;
        }

        const sortedChats = GroupChatSidebarUtils.sortByUpdatedAtDesc(response);
        setChats(sortedChats);

        console.info("[GroupChatSidebar] chats loaded", {
          groupId,
          count: sortedChats.length,
        });
      } catch (error) {
        const isStaleFetch = fetchId !== activeFetchIdRef.current;
        if (isStaleFetch) {
          return;
        }

        console.error("[GroupChatSidebar] failed to load chats", {
          groupId,
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
    },
    [groupId],
  );

  useEffect(() => {
    const isSilentRefresh = hasLoadedOnceRef.current;
    hasLoadedOnceRef.current = true;
    void fetchChats({ silent: isSilentRefresh });
  }, [fetchChats, refreshKey]);

  function handleOpenChat(chat: GroupChatSummaryResponse) {
    const isAlreadyActive = chat.chatId === activeChatId;
    if (isAlreadyActive) {
      return;
    }

    const targetPath = GroupChatSidebarUtils.buildChatPath(groupId, chat.chatId);
    navigate(targetPath);
  }

  async function handleCreateChat() {
    setIsCreating(true);

    console.info("[GroupChatSidebar] creating chat", { groupId });

    try {
      const createdChat = await GroupChatsService.create(groupId);
      const targetPath = GroupChatSidebarUtils.buildChatPath(
        groupId,
        createdChat.chatId,
      );

      console.info("[GroupChatSidebar] chat created", {
        groupId,
        chatId: createdChat.chatId,
      });

      navigate(targetPath);
    } catch (error) {
      console.error("[GroupChatSidebar] failed to create chat", {
        groupId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRenameChat(chatId: number, title: string) {
    setIsMutating(true);

    try {
      const updatedChat = await GroupChatsService.updateTitle(
        groupId,
        chatId,
        title,
      );
      const nextChats = GroupChatSidebarUtils.replaceChat(chats, updatedChat);
      const sortedChats = GroupChatSidebarUtils.sortByUpdatedAtDesc(nextChats);
      setChats(sortedChats);

      console.info("[GroupChatSidebar] chat renamed", { groupId, chatId });
    } catch (error) {
      console.error("[GroupChatSidebar] failed to rename chat", {
        groupId,
        chatId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteChat(chatId: number) {
    const deletedChat = chats.find((chat) => chat.id === chatId);
    const deletedChatUuid = deletedChat?.chatId;

    setIsMutating(true);

    try {
      await GroupChatsService.delete(groupId, chatId);
      const nextChats = GroupChatSidebarUtils.removeChat(chats, chatId);
      setChats(nextChats);

      console.info("[GroupChatSidebar] chat deleted", { groupId, chatId });

      const isActiveChat = deletedChatUuid === activeChatId;
      if (isActiveChat && onActiveChatDeleted) {
        onActiveChatDeleted();
      }
    } catch (error) {
      console.error("[GroupChatSidebar] failed to delete chat", {
        groupId,
        chatId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  function handleRetry() {
    void fetchChats();
  }

  const hasChats = chats.length > 0;
  const shouldShowEmptyState = !isLoading && !hasLoadError && !hasChats;
  const createButtonLabel = isCreating ? "Creating..." : "New chat";
  const isListDisabled = isMutating || isCreating;

  return (
    <aside
      className="flex w-72 shrink-0 flex-col border-r border-border/50 bg-card/40"
      aria-label="Group chats"
    >
      <div className="border-b border-border/50 p-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void handleCreateChat()}
          disabled={isCreating || isMutating}
        >
          {createButtonLabel}
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
              Could not load group chats.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        )}

        {shouldShowEmptyState && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No chats yet.
          </p>
        )}

        {hasChats && !isLoading && !hasLoadError && (
          <ul className="flex flex-col gap-1">
            {chats.map((chat) => {
              const isActive = chat.chatId === activeChatId;

              return (
                <li key={chat.id}>
                  <GroupChatListItem
                    chat={chat}
                    isActive={isActive}
                    isDisabled={isListDisabled}
                    onOpen={handleOpenChat}
                    onRename={handleRenameChat}
                    onDelete={handleDeleteChat}
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
