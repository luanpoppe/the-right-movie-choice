import fastify from "fastify";
import { moviesControllers } from "./domains/movies/infrastructure/http/controllers/routes";
import z, { ZodError } from "zod";
import { BaseException } from "./core/exceptions/base.exception";
import { env } from "./env";
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import { fastifyCors } from "@fastify/cors";
import {
  jsonSchemaTransform,
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
  origin: [/^http:\/\/localhost(:\d+)?$/, /\.vercel\.app$/],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "chatId"],
  credentials: true,
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "The Right Movie Choice",
      version: "1.0.0",
    },
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: "/swagger",
});

app.setErrorHandler((error, app, reply) => {
  console.log({ error });

  if (error.validation) {
    console.log({ errorValidation: error.validation });
    return reply.status(400).send({ error: error.validation });
  }

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
