import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Chat } from "@/features/chat";
import { Welcome } from "@/features/welcome";
import { ChatEntity } from "@/features/chat/entities/chat.entity";
import { UserConversationService } from "@/features/conversations/services/user-conversation.service";
import { MovieRecommendationRequestDTO } from "@/features/movies/dto/movie-recommendation.dto";
import { MovieRecommendationService } from "@/features/movies/services/movie-recommendation.service";
import { GuestChatLockUtils } from "@/features/movies/utils/guest-chat-lock.utils";
import { useAuth } from "@/features/auth/context/AuthContext";
import { StringUtils } from "@/utils/string.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export function Home() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [messages, setMessages] = useState<ChatEntity>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatId, setChatId] = useState<string>(crypto.randomUUID());
  const [guestLockFlag, setGuestLockFlag] = useState(false);
  const [excludeWatched, setExcludeWatched] = useState(true);

  const isGuestLocked = guestLockFlag && !hasAccessToken;

  const handleAuthenticatedSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const input = form.message.value.trim();
    const isInputEmpty = input.length === 0;
    if (isInputEmpty) {
      return;
    }

    const excludeWatchedField = form.elements.namedItem("excludeWatched");
    const isExcludeWatchedChecked =
      excludeWatchedField instanceof HTMLInputElement &&
      excludeWatchedField.checked;

    form.message.value = "";
    setIsLoading(true);

    console.info("[Home] authenticated submit started");

    try {
      let conversation;
      try {
        conversation = await UserConversationService.create();
      } catch (createError) {
        console.error("[Home] conversation create failed", {
          error: createError,
        });
        toast.error(GENERIC_ERROR_TOAST);
        return;
      }

      const requestBody: MovieRecommendationRequestDTO = {
        userMessage: input,
        excludeWatched: isExcludeWatchedChecked,
      };
      const conversationChatId = conversation.chatId;
      const conversationId = conversation.id;

      let recommendation;
      try {
        recommendation = await MovieRecommendationService.getRecommendations(
          requestBody,
          conversationChatId,
        );
      } catch (recommendationError) {
        console.error("[Home] authenticated recommendation failed", {
          conversationId,
          error: recommendationError,
        });

        try {
          await UserConversationService.delete(conversationId);
        } catch (deleteError) {
          console.error("[Home] failed to rollback orphan conversation", {
            conversationId,
            error: deleteError,
          });
        }

        toast.error(GENERIC_ERROR_TOAST);
        return;
      }

      const conversationPath = `/conversations/${conversationId}`;
      console.info("[Home] navigating to conversation", { conversationId });
      navigate(conversationPath, {
        state: {
          conversationBootstrap: {
            response: recommendation.response,
            movies: recommendation.movies,
          },
        },
      });
    } catch (error) {
      console.error("[Home] authenticated submit failed", { error });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isGuestLocked) {
      console.info("[Home] submit ignorado: guest lock ativo");
      return;
    }

    const form = event.target as HTMLFormElement;
    const input = form.message.value.trim();
    const isInputEmpty = input.length === 0;
    if (isInputEmpty) {
      return;
    }

    setMessages([...messages, { from: "user", message: input }]);
    setHasStartedChat(true);
    form.message.value = "";
    setIsLoading(true);

    try {
      const requestBody: MovieRecommendationRequestDTO = {
        userMessage: input,
      };

      const recommendation = await MovieRecommendationService.getRecommendations(
        requestBody,
        chatId,
      );
      const { movies, response, guestRemaining } = recommendation;

      const shouldLockGuest = GuestChatLockUtils.shouldLockAfterSuccess({
        hasAccessToken,
        guestRemaining,
      });

      if (shouldLockGuest) {
        console.info("[Home] guest lock após remaining 0");
        setGuestLockFlag(true);
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          from: "ai",
          message: response,
          movies: movies,
        },
      ]);
    } catch (error) {
      const shouldLockAnonymous401 = GuestChatLockUtils.shouldLockOnError({
        error,
        hasAccessToken,
      });
      if (shouldLockAnonymous401) {
        console.info("[Home] guest lock após 401 anônimo; sem toast genérico");
        setGuestLockFlag(true);
        return;
      }

      console.error({ error });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setChatId(crypto.randomUUID());
    setHasStartedChat(false);
    setMessages([]);
    setIsLoading(false);
    setExcludeWatched(true);
  };

  if (hasAccessToken) {
    return (
      <Welcome
        handleSubmit={handleAuthenticatedSubmit}
        isLoading={isLoading}
        isGuestLocked={false}
        excludeWatched={excludeWatched}
        onExcludeWatchedChange={setExcludeWatched}
        hasAccessToken={hasAccessToken}
      />
    );
  }

  if (!hasStartedChat) {
    return (
      <Welcome
        handleSubmit={handleGuestSubmit}
        isLoading={isLoading}
        isGuestLocked={isGuestLocked}
        excludeWatched={excludeWatched}
        onExcludeWatchedChange={setExcludeWatched}
        hasAccessToken={hasAccessToken}
      />
    );
  }

  return (
    <Chat
      handleReset={handleReset}
      displayMessages={messages}
      isLoading={isLoading}
      handleSubmit={handleGuestSubmit}
      isGuestLocked={isGuestLocked}
      excludeWatched={excludeWatched}
      onExcludeWatchedChange={setExcludeWatched}
      hasAccessToken={hasAccessToken}
    />
  );
}
