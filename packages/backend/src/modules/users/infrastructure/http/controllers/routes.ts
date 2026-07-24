import { FastifyInstance } from "fastify";
import { CreateUserDocs } from "../docs/create-user.docs";
import { createUserController } from "./create-user.controller";

export async function usersControllers(app: FastifyInstance) {
  app.post("/users/register", CreateUserDocs as any, createUserController);
}
