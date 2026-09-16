import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChatEntity } from "@/features/chat/entities/chat.entity";
import { MovieRecommendationRequestDTO } from "@/features/movies/dto/movie-recommendation.dto";
import { MovieRecommendationService } from "@/features/movies/services/movie-recommendation.service";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export interface UseConversationChatParams {
  chatId: string;
  initialMessages?: ChatEntity;
}

export interface UseConversationChatResult {
  messages: ChatEntity;
  isLoading: boolean;
  chatId: string;
  excludeWatched: boolean;
  setExcludeWatched: (value: boolean) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  sidebarRefreshKey: number;
  setMessages: React.Dispatch<React.SetStateAction<ChatEntity>>;
  setChatId: (nextChatId: string) => void;
}

class ConversationChatFormUtils {
  static readUserMessage(form: HTMLFormElement): string {
    const messageField = form.message;
    const isMessageInput = messageField instanceof HTMLInputElement;
    if (!isMessageInput) {
      return "";
    }

    const trimmedMessage = messageField.value.trim();
    return trimmedMessage;
  }

  static readExcludeWatched(form: HTMLFormElement): boolean {
    const excludeWatchedField = form.elements.namedItem("excludeWatched");
    const isCheckbox = excludeWatchedField instanceof HTMLInputElement;
    if (!isCheckbox) {
      return false;
    }

    return excludeWatchedField.checked;
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

export function useConversationChat(
  params: UseConversationChatParams,
): UseConversationChatResult {
  const initialMessages = params.initialMessages ?? [];

  const [messages, setMessages] = useState<ChatEntity>(initialMessages);
  const [chatId, setChatId] = useState(params.chatId);
  const [isLoading, setIsLoading] = useState(false);
  const [excludeWatched, setExcludeWatched] = useState(true);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  useEffect(() => {
    setChatId(params.chatId);
    setMessages(params.initialMessages ?? []);
  }, [params.chatId, params.initialMessages]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const form = event.currentTarget;
      const userMessage = ConversationChatFormUtils.readUserMessage(form);
      const hasUserMessage = userMessage.length > 0;
      if (!hasUserMessage) {
        return;
      }

      const isExcludeWatchedChecked =
        ConversationChatFormUtils.readExcludeWatched(form);

      const userChatMessage = {
        from: "user" as const,
        message: userMessage,
      };
      setMessages((currentMessages) => [...currentMessages, userChatMessage]);

      ConversationChatFormUtils.clearMessageField(form);
      setIsLoading(true);

      console.info("[useConversationChat] submitting recommendation", {
        chatId,
      });

      try {
        const requestBody: MovieRecommendationRequestDTO = {
          userMessage,
          excludeWatched: isExcludeWatchedChecked,
        };

        const recommendation = await MovieRecommendationService.getRecommendations(
          requestBody,
          chatId,
        );

        const aiChatMessage = {
          from: "ai" as const,
          message: recommendation.response,
          movies: recommendation.movies,
        };
        setMessages((currentMessages) => [...currentMessages, aiChatMessage]);

        setSidebarRefreshKey((currentKey) => currentKey + 1);

        console.info("[useConversationChat] recommendation succeeded", {
          chatId,
        });
      } catch (error) {
        console.error("[useConversationChat] recommendation failed", {
          chatId,
          error,
        });
        toast.error(GENERIC_ERROR_TOAST);
      } finally {
        setIsLoading(false);
      }
    },
    [chatId],
  );

  return {
    messages,
    isLoading,
    chatId,
    excludeWatched,
    setExcludeWatched,
    handleSubmit,
    sidebarRefreshKey,
    setMessages,
    setChatId,
  };
}
