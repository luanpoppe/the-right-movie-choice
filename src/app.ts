import fastify from "fastify";
import { moviesControllers } from "./domains/movies/infrastructure/http/controllers/routes";
import z, { ZodError } from "zod";
import { BaseException } from "./core/exceptions/base.exception";
import { env } from "./env";

const app = fastify();

app.setErrorHandler((error, app, reply) => {
  console.log({ error });

  if (error instanceof BaseException) {
    return reply.status(error.statusCode).send({ error: error.message });
  } else if (error instanceof ZodError)
    return reply.status(400).send(z.treeifyError(error));

  const isProd = env.NODE_ENV === "prod";

  return reply
    .status(500)
    .send({ error: isProd ? "Unknow Error" : error.message });
});

app.register(moviesControllers);

export { app };
