import { JoseAccessTokenProvider } from "@/modules/auth/infrastructure/providers/jose-access-token.provider";
import { UserMovieEntryAuthHook } from "@/domains/movies/infrastructure/http/hooks/user-movie-entry-auth.hook";
import { AcceptGroupInviteUseCase } from "@/modules/social/application/use-cases/accept-group-invite.use-case";
import { CancelGroupInviteUseCase } from "@/modules/social/application/use-cases/cancel-group-invite.use-case";
import { CreateUserGroupUseCase } from "@/modules/social/application/use-cases/create-user-group.use-case";
import { DeleteUserGroupUseCase } from "@/modules/social/application/use-cases/delete-user-group.use-case";
import { LeaveUserGroupUseCase } from "@/modules/social/application/use-cases/leave-user-group.use-case";
import { ListGroupMembersUseCase } from "@/modules/social/application/use-cases/list-group-members.use-case";
import { ListIncomingGroupInvitesUseCase } from "@/modules/social/application/use-cases/list-incoming-group-invites.use-case";
import { ListUserGroupsUseCase } from "@/modules/social/application/use-cases/list-user-groups.use-case";
import { RejectGroupInviteUseCase } from "@/modules/social/application/use-cases/reject-group-invite.use-case";
import { RemoveGroupMemberUseCase } from "@/modules/social/application/use-cases/remove-group-member.use-case";
import { SendGroupInviteUseCase } from "@/modules/social/application/use-cases/send-group-invite.use-case";
import { SuggestGroupFriendsUseCase } from "@/modules/social/application/use-cases/suggest-group-friends.use-case";
import { UpdateUserGroupUseCase } from "@/modules/social/application/use-cases/update-user-group.use-case";
import { PrismaUserRepository } from "@/modules/users/infrastructure/repositories/prisma-user.repository";
import { UserGroupsController } from "../http/controllers/user-groups.controller";
import { PrismaFriendRequestRepository } from "../repositories/friend-request/prisma-friend-request.repository";
import { PrismaGroupInviteRepository } from "../repositories/group-invite/prisma-group-invite.repository";
import { PrismaUserGroupRepository } from "../repositories/user-group/prisma-user-group.repository";

export class MakeUserGroupsHttpFactory {
  static create() {
    const accessTokenProvider = new JoseAccessTokenProvider();
    const userGroupRepository = new PrismaUserGroupRepository();
    const groupInviteRepository = new PrismaGroupInviteRepository();
    const friendRequestRepository = new PrismaFriendRequestRepository();
    const userRepository = new PrismaUserRepository();

    const createUserGroupUseCase = new CreateUserGroupUseCase(
      userGroupRepository,
    );
    const listUserGroupsUseCase = new ListUserGroupsUseCase(
      userGroupRepository,
    );
    const updateUserGroupUseCase = new UpdateUserGroupUseCase(
      userGroupRepository,
    );
    const deleteUserGroupUseCase = new DeleteUserGroupUseCase(
      userGroupRepository,
    );
    const sendGroupInviteUseCase = new SendGroupInviteUseCase(
      groupInviteRepository,
      userGroupRepository,
      userRepository,
    );
    const leaveUserGroupUseCase = new LeaveUserGroupUseCase(
      userGroupRepository,
    );
    const removeGroupMemberUseCase = new RemoveGroupMemberUseCase(
      userGroupRepository,
    );
    const listGroupMembersUseCase = new ListGroupMembersUseCase(
      userGroupRepository,
    );
    const suggestGroupFriendsUseCase = new SuggestGroupFriendsUseCase(
      userGroupRepository,
      friendRequestRepository,
    );
    const acceptGroupInviteUseCase = new AcceptGroupInviteUseCase(
      groupInviteRepository,
    );
    const rejectGroupInviteUseCase = new RejectGroupInviteUseCase(
      groupInviteRepository,
    );
    const cancelGroupInviteUseCase = new CancelGroupInviteUseCase(
      groupInviteRepository,
    );
    const listIncomingGroupInvitesUseCase = new ListIncomingGroupInvitesUseCase(
      groupInviteRepository,
    );

    const preHandler = UserMovieEntryAuthHook.createPreHandler({
      accessTokenProvider,
    });
    const handlers = UserGroupsController.create({
      createUserGroupUseCase,
      listUserGroupsUseCase,
      updateUserGroupUseCase,
      deleteUserGroupUseCase,
      sendGroupInviteUseCase,
      leaveUserGroupUseCase,
      removeGroupMemberUseCase,
      listGroupMembersUseCase,
      suggestGroupFriendsUseCase,
      acceptGroupInviteUseCase,
      rejectGroupInviteUseCase,
      cancelGroupInviteUseCase,
      listIncomingGroupInvitesUseCase,
    });

    return { preHandler, handlers };
  }
}
