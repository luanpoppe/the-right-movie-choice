import type { GroupMemberEntity } from "../entities/group-member.entity";
import type {
  UserGroupEntity,
  UserGroupListItemEntity,
} from "../entities/user-group.entity";

export interface IUserGroupRepository {
  findById(groupId: number): Promise<UserGroupEntity | null>;

  createWithOwner(
    ownerId: number,
    name: string,
    description?: string,
  ): Promise<UserGroupEntity>;

  updateGroup(
    groupId: number,
    patch: { name?: string; description?: string | null },
  ): Promise<UserGroupEntity>;

  deleteGroup(groupId: number): Promise<void>;

  listGroupsForUser(userId: number): Promise<UserGroupListItemEntity[]>;

  findMembership(
    groupId: number,
    userId: number,
  ): Promise<GroupMemberEntity | null>;

  isOwner(groupId: number, userId: number): Promise<boolean>;

  countMembers(groupId: number): Promise<number>;

  addMember(groupId: number, userId: number): Promise<GroupMemberEntity>;

  removeMember(groupId: number, userId: number): Promise<void>;

  transferOwnership(
    groupId: number,
    newOwnerId: number,
  ): Promise<UserGroupEntity>;

  findOldestMemberAfterOwner(
    groupId: number,
    excludingUserId: number,
  ): Promise<GroupMemberEntity | null>;

  deleteGroupAndRelated(groupId: number): Promise<void>;
}
