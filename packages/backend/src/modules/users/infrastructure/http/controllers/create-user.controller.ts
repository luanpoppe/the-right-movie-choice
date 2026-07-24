import { FastifyReply, FastifyRequest } from "fastify";
import { CreateUserRequest, CreateUserResponse } from "../dto/create-user.dto";
import { MakeCreateUserUseCaseFactory } from "../../factories/make-create-user-use-case.factory";

export async function createUserController(
  request: FastifyRequest<{ Body: CreateUserRequest }>,
  reply: FastifyReply,
) {
  const { email, name, password } = request.body;

  const useCase = MakeCreateUserUseCaseFactory.create();
  const user = await useCase.execute({ email, name, password });

  const responseBody: CreateUserResponse = user;

  return reply.status(201).send(responseBody);
}
