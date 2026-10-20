import { useEffect, useRef, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExcludeWatchedToggle } from "@/features/chat/components/ExcludeWatchedToggle";
import { GuestLockBanner } from "@/features/movies/components/guest-lock-banner";
import { WelcomeFormUtils } from "../utils/welcome-form.utils";
import { InputSuggestions } from "./InputSuggestions";

const PROMPT_PLACEHOLDER = "What kind of movie are you looking for?";
const TEXTAREA_MAX_HEIGHT_PX = 200;

interface FormProps {
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isGuestLocked?: boolean;
  excludeWatched: boolean;
  onExcludeWatchedChange: (value: boolean) => void;
  hasAccessToken: boolean;
}

export function Form({
  handleSubmit,
  isLoading,
  isGuestLocked = false,
  excludeWatched,
  onExcludeWatchedChange,
  hasAccessToken,
}: FormProps) {
  const isDisabled = isLoading || isGuestLocked;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(
      textarea.scrollHeight,
      TEXTAREA_MAX_HEIGHT_PX,
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > TEXTAREA_MAX_HEIGHT_PX ? "auto" : "hidden";
  }

  useEffect(() => {
    resizeTextarea();

    // No mobile o foco automatico rola a pagina para o formulario, escondendo
    // o topo da home. Foca apenas no desktop e sem rolar.
    const shouldAutoFocus = WelcomeFormUtils.shouldAutoFocusTextarea();
    if (!shouldAutoFocus) {
      return;
    }

    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  function handleSuggestionSelect(suggestion: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      console.error("[Form] textarea não encontrado ao aplicar sugestão");
      return;
    }

    textarea.value = suggestion;
    resizeTextarea();
    textarea.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const isSendShortcut = event.key === "Enter" && !event.shiftKey;
    if (!isSendShortcut) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    handleSubmit(event);
    resizeTextarea();
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {isGuestLocked && (
        <div className="mx-auto w-full max-w-[720px]">
          <GuestLockBanner />
        </div>
      )}

      {hasAccessToken && (
        <div className="mx-auto w-full max-w-[720px]">
          <ExcludeWatchedToggle
            showToggle={hasAccessToken}
            excludeWatched={excludeWatched}
            onExcludeWatchedChange={onExcludeWatchedChange}
            isLoading={isLoading}
            isGuestLocked={isGuestLocked}
          />
        </div>
      )}

      <div className="relative mx-auto w-full max-w-[720px]">
        <Textarea
          ref={textareaRef}
          name="message"
          rows={2}
          placeholder={PROMPT_PLACEHOLDER}
          disabled={isDisabled}
          onKeyDown={handleKeyDown}
          onChange={resizeTextarea}
          className="min-h-[96px] resize-none overflow-hidden rounded-2xl border-primary/25 bg-card py-4 pl-5 pr-20 text-lg placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/50"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={isDisabled}
          size="icon"
          aria-label="Get recommendations"
          className="absolute bottom-3 right-3 h-12 w-12 rounded-xl"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <InputSuggestions
        isLoading={isLoading}
        isGuestLocked={isGuestLocked}
        onSuggestionSelect={handleSuggestionSelect}
      />
    </form>
  );
}
