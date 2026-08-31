import { useState } from "react";
import toast from "react-hot-toast";
import { Chat } from "@/features/chat";
import { Welcome } from "@/features/welcome";
import { ChatEntity } from "@/features/chat/entities/chat.entity";
import { MovieRecommendationService } from "@/features/movies/services/movie-recommendation.service";
import { GuestChatLockUtils } from "@/features/movies/utils/guest-chat-lock.utils";
import { useAuth } from "@/features/auth/context/AuthContext";
import { StringUtils } from "@/utils/string.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export function Home() {
  const { accessToken } = useAuth();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [messages, setMessages] = useState<ChatEntity>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatId, setChatId] = useState<string>(crypto.randomUUID());
  const [guestLockFlag, setGuestLockFlag] = useState(false);

  const isGuestLocked = guestLockFlag && !hasAccessToken;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isGuestLocked) {
      console.info("[Home] submit ignorado: guest lock ativo");
      return;
    }

    const target = e.target as HTMLFormElement;
    const input = target.message.value.trim();
    if (!input) return;

    setMessages([...messages, { from: "user", message: input }]);
    setHasStartedChat(true);
    target.message.value = "";
    setIsLoading(true);

    try {
      const { movies, response, guestRemaining } =
        await MovieRecommendationService.getRecommendations(
          { userMessage: input },
          chatId,
        );

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
  };

  if (!hasStartedChat) {
    return (
      <Welcome
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        isGuestLocked={isGuestLocked}
      />
    );
  }

  return (
    <Chat
      handleReset={handleReset}
      displayMessages={messages}
      isLoading={isLoading}
      handleSubmit={handleSubmit}
      isGuestLocked={isGuestLocked}
    />
  );
}
