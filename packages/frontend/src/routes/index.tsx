import { createBrowserRouter } from "react-router";
import { Root } from "../Root";
import { Home } from "../pages/Home";
import { MyMoviesPage } from "../pages/MyMoviesPage";
import { ConversationsListPage } from "../pages/ConversationsListPage";
import { ConversationChatPage } from "../pages/ConversationChatPage";
import { SocialPage } from "../pages/SocialPage";
import { GroupDetailPage } from "../pages/GroupDetailPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";

export const routers = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "login",
        Component: LoginPage,
      },
      {
        path: "register",
        Component: RegisterPage,
      },
      {
        path: "my-movies",
        Component: MyMoviesPage,
      },
      {
        path: "conversations",
        Component: ConversationsListPage,
      },
      {
        path: "conversations/:id",
        Component: ConversationChatPage,
      },
      {
        path: "social",
        Component: SocialPage,
      },
      {
        path: "social/groups/:id",
        Component: GroupDetailPage,
      },
    ],
  },
]);
