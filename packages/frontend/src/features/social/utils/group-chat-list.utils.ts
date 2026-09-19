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

  static formatDisplayTitle(
    title: string | null,
    updatedAt: string,
  ): string {
    const displayTitle = ConversationTitleUtils.formatDisplayTitle(
      title,
      updatedAt,
    );

    return displayTitle;
  }
}
