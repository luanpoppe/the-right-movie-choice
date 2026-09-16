import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

export class ConversationTitleUtils {
  static readonly NULL_TITLE_LABEL = "New Conversation";

  static formatDisplayTitle(
    title: string | null,
    updatedAt: string,
  ): string {
    const hasCustomTitle = title !== null && title.trim() !== "";
    if (hasCustomTitle) {
      return title.trim();
    }

    const updatedDate = new Date(updatedAt);
    const relativeTime = formatDistanceToNow(updatedDate, {
      addSuffix: true,
      locale: enUS,
    });
    const displayTitle = `${ConversationTitleUtils.NULL_TITLE_LABEL} · ${relativeTime}`;

    return displayTitle;
  }

  static canSubmitRename(value: string): boolean {
    const trimmedValue = value.trim();
    const hasContent = trimmedValue.length > 0;

    return hasContent;
  }

  static normalizeRenameValue(value: string): string {
    const trimmedValue = value.trim();

    return trimmedValue;
  }

  static shouldSkipRename(
    currentTitle: string | null,
    nextTitle: string,
  ): boolean {
    const normalizedNextTitle =
      ConversationTitleUtils.normalizeRenameValue(nextTitle);

    const canSubmit = ConversationTitleUtils.canSubmitRename(normalizedNextTitle);
    if (!canSubmit) {
      return true;
    }

    const currentNormalized =
      currentTitle === null ? "" : currentTitle.trim();
    const isUnchanged = normalizedNextTitle === currentNormalized;

    return isUnchanged;
  }
}
