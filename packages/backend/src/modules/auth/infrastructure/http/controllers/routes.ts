import { FastifyInstance } from "fastify";
import { GoogleAuthDocs } from "../docs/google-auth.docs";
import { LoginDocs } from "../docs/login.docs";
import { RefreshDocs } from "../docs/refresh.docs";
import { LogoutDocs } from "../docs/logout.docs";
import {
  googleAuthController,
  loginController,
  logoutController,
  refreshController,
} from "./auth.controller";

export async function authControllers(app: FastifyInstance) {
  app.post("/auth/google", GoogleAuthDocs as any, googleAuthController);
  app.post("/auth/login", LoginDocs as any, loginController);
  app.post("/auth/refresh", RefreshDocs as any, refreshController);
  app.post("/auth/logout", LogoutDocs as any, logoutController);
}
