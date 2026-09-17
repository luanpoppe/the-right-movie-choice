import { JoseAccessTokenProvider } from "@/modules/auth/infrastructure/providers/jose-access-token.provider";
import { UserMovieEntryAuthHook } from "@/domains/movies/infrastructure/http/hooks/user-movie-entry-auth.hook";
import { AcceptFriendRequestUseCase } from "@/modules/social/application/use-cases/accept-friend-request.use-case";
import { CancelFriendRequestUseCase } from "@/modules/social/application/use-cases/cancel-friend-request.use-case";
import { ListFriendsUseCase } from "@/modules/social/application/use-cases/list-friends.use-case";
import { ListIncomingFriendRequestsUseCase } from "@/modules/social/application/use-cases/list-incoming-friend-requests.use-case";
import { ListOutgoingFriendRequestsUseCase } from "@/modules/social/application/use-cases/list-outgoing-friend-requests.use-case";
import { RejectFriendRequestUseCase } from "@/modules/social/application/use-cases/reject-friend-request.use-case";
import { RemoveFriendUseCase } from "@/modules/social/application/use-cases/remove-friend.use-case";
import { SearchUserByEmailUseCase } from "@/modules/social/application/use-cases/search-user-by-email.use-case";
import { SendFriendRequestUseCase } from "@/modules/social/application/use-cases/send-friend-request.use-case";
import { PrismaUserRepository } from "@/modules/users/infrastructure/repositories/prisma-user.repository";
import { FriendshipController } from "../http/controllers/friendship.controller";
import { PrismaFriendRequestRepository } from "../repositories/friend-request/prisma-friend-request.repository";

export class MakeFriendshipHttpFactory {
  static create() {
    const accessTokenProvider = new JoseAccessTokenProvider();
    const friendRequestRepository = new PrismaFriendRequestRepository();
    const userRepository = new PrismaUserRepository();

    const sendFriendRequestUseCase = new SendFriendRequestUseCase(
      friendRequestRepository,
      userRepository,
    );
    const acceptFriendRequestUseCase = new AcceptFriendRequestUseCase(
      friendRequestRepository,
    );
    const rejectFriendRequestUseCase = new RejectFriendRequestUseCase(
      friendRequestRepository,
    );
    const cancelFriendRequestUseCase = new CancelFriendRequestUseCase(
      friendRequestRepository,
    );
    const removeFriendUseCase = new RemoveFriendUseCase(
      friendRequestRepository,
    );
    const listFriendsUseCase = new ListFriendsUseCase(friendRequestRepository);
    const listIncomingFriendRequestsUseCase =
      new ListIncomingFriendRequestsUseCase(friendRequestRepository);
    const listOutgoingFriendRequestsUseCase =
      new ListOutgoingFriendRequestsUseCase(friendRequestRepository);
    const searchUserByEmailUseCase = new SearchUserByEmailUseCase(
      friendRequestRepository,
      userRepository,
    );

    const preHandler = UserMovieEntryAuthHook.createPreHandler({
      accessTokenProvider,
    });
    const handlers = FriendshipController.create({
      sendFriendRequestUseCase,
      acceptFriendRequestUseCase,
      rejectFriendRequestUseCase,
      cancelFriendRequestUseCase,
      removeFriendUseCase,
      listFriendsUseCase,
      listIncomingFriendRequestsUseCase,
      listOutgoingFriendRequestsUseCase,
      searchUserByEmailUseCase,
    });

    return { preHandler, handlers };
  }
}
