import { createBrowserRouter } from "react-router";
import { Root } from "../Root";

export const routers = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("../pages/Home")).Home }),
      },
      {
        path: "login",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/LoginPage"))
            .LoginPage,
        }),
      },
      {
        path: "register",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/RegisterPage"))
            .RegisterPage,
        }),
      },
      {
        path: "my-movies",
        lazy: async () => ({
          Component: (await import("../pages/MyMoviesPage")).MyMoviesPage,
        }),
      },
      {
        path: "search",
        lazy: async () => ({
          Component: (await import("../pages/SearchPage")).SearchPage,
        }),
      },
      {
        path: "conversations",
        lazy: async () => ({
          Component: (await import("../pages/ConversationsListPage"))
            .ConversationsListPage,
        }),
      },
      {
        path: "conversations/:id",
        lazy: async () => ({
          Component: (await import("../pages/ConversationChatPage"))
            .ConversationChatPage,
        }),
      },
      {
        path: "social",
        lazy: async () => ({
          Component: (await import("../pages/SocialPage")).SocialPage,
        }),
      },
      {
        path: "social/groups/:groupId/chats/:chatId",
        lazy: async () => ({
          Component: (await import("../pages/GroupChatPage")).GroupChatPage,
        }),
      },
      {
        path: "social/groups/:id",
        lazy: async () => ({
          Component: (await import("../pages/GroupDetailPage")).GroupDetailPage,
        }),
      },
      {
        path: "*",
        lazy: async () => ({
          Component: (await import("../pages/NotFoundPage")).NotFoundPage,
        }),
      },
    ],
  },
]);
