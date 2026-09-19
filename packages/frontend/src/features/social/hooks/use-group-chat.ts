import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ChatEntity } from "@/features/chat/entities/chat.entity";
import { ChatHistoryMapperUtils } from "@/features/conversations/utils/chat-history-mapper.utils";
import { GROUP_CHAT_POLLING_INTERVAL_MS } from "@/features/social/constants/group-chat-polling.constants";
import {
  type GroupChatGetResponse,
  type GroupChatSummaryResponse,
} from "@/features/social/dto/group-chats.dto";
import { GroupChatsService } from "@/features/social/services/group-chats.service";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export interface UseGroupChatParams {
  groupId: number;
  chatId: string;
  initialMessages?: ChatEntity;
  enabled?: boolean;
}

export interface UseGroupChatResult {
  messages: ChatEntity;
  setMessages: React.Dispatch<React.SetStateAction<ChatEntity>>;
  isLoading: boolean;
  isPolling: boolean;
  chatSummary: GroupChatSummaryResponse | null;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  refetch: () => Promise<void>;
  sidebarRefreshKey: number;
}

class GroupChatFormUtils {
  static readUserMessage(form: HTMLFormElement): string {
    const messageField = form.message;
    const isMessageInput = messageField instanceof HTMLInputElement;
    if (!isMessageInput) {
      return "";
    }

    const trimmedMessage = messageField.value.trim();
    return trimmedMessage;
  }

  static clearMessageField(form: HTMLFormElement): void {
    const messageField = form.message;
    const isMessageInput = messageField instanceof HTMLInputElement;
    if (!isMessageInput) {
      return;
    }

    messageField.value = "";
  }
}

class GroupChatResponseUtils {
  static toSummary(response: GroupChatGetResponse): GroupChatSummaryResponse {
    const summary: GroupChatSummaryResponse = {
      id: response.id,
      groupId: response.groupId,
      chatId: response.chatId,
      title: response.title,
      filterMemberUserIds: response.filterMemberUserIds,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };

    return summary;
  }
}

export function useGroupChat(params: UseGroupChatParams): UseGroupChatResult {
  const enabled = params.enabled ?? true;
  const initialMessages = params.initialMessages ?? [];

  const [messages, setMessages] = useState<ChatEntity>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [chatSummary, setChatSummary] = useState<GroupChatSummaryResponse | null>(
    null,
  );
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  const activeGroupIdRef = useRef(params.groupId);
  const activeChatIdRef = useRef(params.chatId);
  const activeFetchIdRef = useRef(0);

  useEffect(() => {
    activeGroupIdRef.current = params.groupId;
    activeChatIdRef.current = params.chatId;
    activeFetchIdRef.current += 1;
    setMessages(params.initialMessages ?? []);
    setChatSummary(null);
  }, [params.groupId, params.chatId, params.initialMessages]);

  const fetchChat = useCallback(async () => {
    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    const fetchGroupId = params.groupId;
    const fetchChatId = params.chatId;

    setIsPolling(true);

    console.info("[useGroupChat] fetching chat", {
      groupId: fetchGroupId,
      chatId: fetchChatId,
    });

    try {
      const response = await GroupChatsService.getByChatId(
        fetchGroupId,
        fetchChatId,
      );

      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        console.info("[useGroupChat] ignoring stale chat fetch", {
          groupId: fetchGroupId,
          chatId: fetchChatId,
        });
        return;
      }

      const isStaleContext =
        activeGroupIdRef.current !== fetchGroupId ||
        activeChatIdRef.current !== fetchChatId;
      if (isStaleContext) {
        console.info("[useGroupChat] ignoring chat fetch for outdated context", {
          groupId: fetchGroupId,
          chatId: fetchChatId,
        });
        return;
      }

      const mappedMessages = ChatHistoryMapperUtils.toChatEntity(
        response.messages,
      );
      const summary = GroupChatResponseUtils.toSummary(response);

      setMessages(mappedMessages);
      setChatSummary(summary);

      console.info("[useGroupChat] chat fetched", {
        groupId: fetchGroupId,
        chatId: fetchChatId,
        messageCount: mappedMessages.length,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      const isStaleContext =
        activeGroupIdRef.current !== fetchGroupId ||
        activeChatIdRef.current !== fetchChatId;
      if (isStaleContext) {
        return;
      }

      console.error("[useGroupChat] failed to fetch chat", {
        groupId: fetchGroupId,
        chatId: fetchChatId,
        error,
      });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      const isCurrentFetch = fetchId === activeFetchIdRef.current;
      if (isCurrentFetch) {
        setIsPolling(false);
      }
    }
  }, [params.groupId, params.chatId]);

  const refetch = useCallback(async () => {
    await fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = setInterval(() => {
      void fetchChat();
    }, GROUP_CHAT_POLLING_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, fetchChat]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const form = event.currentTarget;
      const userMessage = GroupChatFormUtils.readUserMessage(form);
      const hasUserMessage = userMessage.length > 0;
      if (!hasUserMessage) {
        return;
      }

      const submissionGroupId = activeGroupIdRef.current;
      const submissionChatId = activeChatIdRef.current;

      const userChatMessage = {
        from: "user" as const,
        message: userMessage,
      };
      setMessages((currentMessages) => [...currentMessages, userChatMessage]);

      GroupChatFormUtils.clearMessageField(form);
      setIsLoading(true);

      console.info("[useGroupChat] submitting recommendation", {
        groupId: submissionGroupId,
        chatId: submissionChatId,
      });

      try {
        const recommendation = await GroupChatsService.recommend(
          submissionGroupId,
          submissionChatId,
          userMessage,
        );

        const isStaleResponse =
          activeGroupIdRef.current !== submissionGroupId ||
          activeChatIdRef.current !== submissionChatId;
        if (isStaleResponse) {
          console.info(
            "[useGroupChat] ignoring stale recommendation response",
            { groupId: submissionGroupId, chatId: submissionChatId },
          );
          return;
        }

        const aiChatMessage = {
          from: "ai" as const,
          message: recommendation.response,
          movies: recommendation.movies,
        };
        setMessages((currentMessages) => [...currentMessages, aiChatMessage]);

        await refetch();

        setSidebarRefreshKey((currentKey) => currentKey + 1);

        console.info("[useGroupChat] recommendation succeeded", {
          groupId: submissionGroupId,
          chatId: submissionChatId,
        });
      } catch (error) {
        const isStaleResponse =
          activeGroupIdRef.current !== submissionGroupId ||
          activeChatIdRef.current !== submissionChatId;
        if (isStaleResponse) {
          return;
        }

        setMessages((currentMessages) => {
          const lastMessage = currentMessages[currentMessages.length - 1];
          const isOrphanUserMessage =
            lastMessage?.from === "user" && lastMessage.message === userMessage;
          if (!isOrphanUserMessage) {
            return currentMessages;
          }

          return currentMessages.slice(0, -1);
        });

        console.error("[useGroupChat] recommendation failed", {
          groupId: submissionGroupId,
          chatId: submissionChatId,
          error,
        });
        toast.error(GENERIC_ERROR_TOAST);
      } finally {
        const isCurrentSubmission =
          activeGroupIdRef.current === submissionGroupId &&
          activeChatIdRef.current === submissionChatId;
        if (isCurrentSubmission) {
          setIsLoading(false);
        }
      }
    },
    [refetch],
  );

  return {
    messages,
    setMessages,
    isLoading,
    isPolling,
    chatSummary,
    handleSubmit,
    refetch,
    sidebarRefreshKey,
  };
}
