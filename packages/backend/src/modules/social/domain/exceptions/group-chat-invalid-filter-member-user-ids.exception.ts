import { BaseException } from "@/core/exceptions/base.exception";

export class GroupChatInvalidFilterMemberUserIdsException extends BaseException {
  statusCode = 400;

  readonly invalidUserIds: number[];

  constructor(invalidUserIds: number[]) {
    const idsList = invalidUserIds.join(", ");
    super(
      `filterMemberUserIds contains user ids that are not group members: ${idsList}`,
    );
    this.invalidUserIds = invalidUserIds;
  }
}
