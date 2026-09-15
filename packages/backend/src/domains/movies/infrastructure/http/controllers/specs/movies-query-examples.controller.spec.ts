import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import { MoviesQueryExamplesResponseDTOSchema } from "../../dto/movies-query-examples.dto";
import { moviesQueryExamplesController } from "../movies-query-examples.controller";

const { mockExecute, mockFactoryCreate } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockFactoryCreate: vi.fn(() => ({
    execute: mockExecute,
  })),
}));

vi.mock("../../../factories/make-get-movies-query-examples-use-case.factory", () => ({
  MakeGetMoviesQueryExamplesUseCaseFactory: {
    create: mockFactoryCreate,
  },
}));

function createReply(): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

describe("moviesQueryExamplesController", () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockFactoryCreate.mockClear();
  });

  it("REQ-5: retorna HTTP 200 com queries de exatamente 3 itens no contrato Zod", async () => {
    const moviesQueryExamples = {
      queryExamples: [
        { queryExample: "80s action movies with strong female leads" },
        { queryExample: "2000s fantasy films with dragons" },
        { queryExample: "sci-fi movies about time travel" },
      ],
    };
    mockExecute.mockResolvedValue({ moviesQueryExamples });
    const reply = createReply();

    await moviesQueryExamplesController({} as FastifyRequest, reply);

    expect(mockFactoryCreate).toHaveBeenCalledOnce();
    expect(mockExecute).toHaveBeenCalledOnce();
    expect(reply.status).toHaveBeenCalledWith(200);
    const sendCalls = vi.mocked(reply.send).mock.calls;
    const sentBody = sendCalls[0]?.[0];
    const parseResult = MoviesQueryExamplesResponseDTOSchema.safeParse(sentBody);
    expect(parseResult.success).toBe(true);
    expect(sentBody).toEqual({ queries: moviesQueryExamples.queryExamples });
  });
});
