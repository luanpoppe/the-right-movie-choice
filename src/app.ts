import fastify from "fastify";
import { moviesControllers } from "./domains/movies/http/controllers/routes";
import z, { ZodError } from "zod";

const app = fastify();

app.setErrorHandler((error, app, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send(z.treeifyError(error));
  }

  return reply.status(500).send({ error: error.message });
});

app.register(moviesControllers);

export { app };
