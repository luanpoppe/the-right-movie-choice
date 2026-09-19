import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { GroupChatListItem } from "@/features/social/components/group-chat-list-item";
import {
  type GroupChatSummaryResponse,
} from "@/features/social/dto/group-chats.dto";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { GroupChatListUtils } from "@/features/social/utils/group-chat-list.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export interface GroupChatsTabProps {
  groupId: number;
}

export class GroupChatsTabUtils {
  static buildChatPath(groupId: number, chatId: string): string {
    const path = `/social/groups/${groupId}/chats/${chatId}`;

    return path;
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
}

export function GroupChatsTab({ groupId }: GroupChatsTabProps) {
  const navigate = useNavigate();
  const [chats, setChats] = useState<GroupChatSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const activeFetchIdRef = useRef(0);

  const fetchChats = useCallback(async () => {
    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    setIsLoading(true);
    setHasLoadError(false);

    console.info("[GroupChatsTab] loading chats", { groupId });

    try {
      const response = await GroupChatsService.list(groupId);
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      const sortedChats = GroupChatListUtils.sortByUpdatedAtDesc(response);
      setChats(sortedChats);

      console.info("[GroupChatsTab] chats loaded", {
        groupId,
        count: sortedChats.length,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      console.error("[GroupChatsTab] failed to load chats", {
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
  }, [groupId]);

  useEffect(() => {
    void fetchChats();
  }, [fetchChats]);

  function handleRetry() {
    void fetchChats();
  }

  function handleOpenChat(chat: GroupChatSummaryResponse) {
    const targetPath = GroupChatsTabUtils.buildChatPath(groupId, chat.chatId);
    navigate(targetPath);
  }

  async function handleCreateChat() {
    setIsCreating(true);

    console.info("[GroupChatsTab] creating chat", { groupId });

    try {
      const createdChat = await GroupChatsService.create(groupId);
      const targetPath = GroupChatsTabUtils.buildChatPath(
        groupId,
        createdChat.chatId,
      );

      console.info("[GroupChatsTab] chat created", {
        groupId,
        chatId: createdChat.chatId,
      });

      navigate(targetPath);
    } catch (error) {
      console.error("[GroupChatsTab] failed to create chat", {
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
      const nextChats = GroupChatsTabUtils.replaceChat(chats, updatedChat);
      const sortedChats = GroupChatListUtils.sortByUpdatedAtDesc(nextChats);
      setChats(sortedChats);

      console.info("[GroupChatsTab] chat renamed", { groupId, chatId });
    } catch (error) {
      console.error("[GroupChatsTab] failed to rename chat", {
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
    setIsMutating(true);

    try {
      await GroupChatsService.delete(groupId, chatId);
      const nextChats = GroupChatsTabUtils.removeChat(chats, chatId);
      setChats(nextChats);

      console.info("[GroupChatsTab] chat deleted", { groupId, chatId });
    } catch (error) {
      console.error("[GroupChatsTab] failed to delete chat", {
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

  const hasChats = chats.length > 0;
  const shouldShowEmptyState = !isLoading && !hasLoadError && !hasChats;
  const createButtonLabel = isCreating ? "Creating..." : "New chat";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Group recommendation chats shared with all members.
        </p>
        <Button
          type="button"
          onClick={() => void handleCreateChat()}
          disabled={isCreating || isMutating}
        >
          {createButtonLabel}
        </Button>
      </div>

      {isLoading && (
        <p className="text-center text-muted-foreground">Loading...</p>
      )}

      {hasLoadError && !isLoading && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Could not load group chats.</p>
          <Button type="button" variant="outline" onClick={handleRetry}>
            Try again
          </Button>
        </div>
      )}

      {shouldShowEmptyState && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">
            This group does not have any chats yet.
          </p>
          <Button
            type="button"
            onClick={() => void handleCreateChat()}
            disabled={isCreating}
          >
            {createButtonLabel}
          </Button>
        </div>
      )}

      {hasChats && !isLoading && !hasLoadError && (
        <ul className="flex flex-col gap-1">
          {chats.map((chat) => (
            <li key={chat.id}>
              <GroupChatListItem
                chat={chat}
                isDisabled={isMutating || isCreating}
                onOpen={handleOpenChat}
                onRename={handleRenameChat}
                onDelete={handleDeleteChat}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
