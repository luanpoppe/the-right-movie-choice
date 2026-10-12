import { ConversationTitleUtils } from "@/features/conversations/utils/conversation-title.utils";
import type { GroupChatSummaryResponse } from "../dto/group-chats.dto";

export class GroupChatListUtils {
  static sortByUpdatedAtDesc(
    chats: GroupChatSummaryResponse[],
  ): GroupChatSummaryResponse[] {
    const sortedChats = [...chats];

    sortedChats.sort((left, right) => {
      const leftTime = new Date(left.updatedAt).getTime();
      const rightTime = new Date(right.updatedAt).getTime();

      return rightTime - leftTime;
    });

    return sortedChats;
  }

  static formatTitle(title: string | null): string {
    const trimmedTitle = title?.trim() ?? "";
    const hasTitle = trimmedTitle.length > 0;
    if (hasTitle) {
      return trimmedTitle;
    }

    return ConversationTitleUtils.NULL_TITLE_LABEL;
  }

  static formatUpdatedAt(updatedAt: string): string {
    return ConversationTitleUtils.formatUpdatedAt(updatedAt);
  }
}
