import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { GetMoviesQueryExamplesUseCase } from "../../../application/use-cases/get-movies-query-examples.use-case";
import { AiMoviesQueryExamplesProvider } from "../../providers/ai-movies-query-examples.provider";
import { AiModels } from "@/lib/ai/ai-models";

const { envState, aiConstructorCalls } = vi.hoisted(() => ({
  envState: {
    OPENROUTER_API_KEY: "openrouter-key",
    GEMINI_API_KEY: "gemini-key",
  },
  aiConstructorCalls: [] as unknown[],
}));

vi.mock("@/env", () => ({
  env: {
    get OPENROUTER_API_KEY() {
      return envState.OPENROUTER_API_KEY;
    },
    get GEMINI_API_KEY() {
      return envState.GEMINI_API_KEY;
    },
  },
}));

vi.mock("@luanpoppe/ai", () => ({
  AI: class AI {
    constructor(config: unknown) {
      aiConstructorCalls.push(config);
    }
  },
}));

import { MakeGetMoviesQueryExamplesUseCaseFactory } from "../make-get-movies-query-examples-use-case.factory";

describe("MakeGetMoviesQueryExamplesUseCaseFactory", () => {
  beforeEach(() => {
    aiConstructorCalls.length = 0;
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "gemini-key";
  });

  it("cria um único AI e injeta AiMoviesQueryExamplesProvider no use case", () => {
    const useCase = MakeGetMoviesQueryExamplesUseCaseFactory.create();
    const provider = (
      useCase as unknown as {
        movieQueryExampleProvider: AiMoviesQueryExamplesProvider;
      }
    ).movieQueryExampleProvider;

    expect(useCase).toBeInstanceOf(GetMoviesQueryExamplesUseCase);
    expect(provider).toBeInstanceOf(AiMoviesQueryExamplesProvider);
    expect(aiConstructorCalls).toHaveLength(1);
  });

  it("omite openRouterApiKey quando a chave está vazia", () => {
    envState.OPENROUTER_API_KEY = "";
    envState.GEMINI_API_KEY = "gemini-key";

    MakeGetMoviesQueryExamplesUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config).not.toHaveProperty("openRouterApiKey");
    expect(Object.keys(config).includes("openRouterApiKey")).toBe(false);
  });

  it("passa openRouterApiKey quando a chave não é vazia", () => {
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "";

    MakeGetMoviesQueryExamplesUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config.openRouterApiKey).toBe("openrouter-key");
  });

  it("inclui Gemini e fallback só quando GEMINI_API_KEY não é vazia", () => {
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "gemini-key";

    MakeGetMoviesQueryExamplesUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config.googleGeminiToken).toBe("gemini-key");
    expect(config.aiModelsFallback).toEqual([AiModels.GEMINI_FALLBACK]);
  });

  it("omite googleGeminiToken e fallback quando GEMINI_API_KEY é vazia", () => {
    envState.OPENROUTER_API_KEY = "openrouter-key";
    envState.GEMINI_API_KEY = "";

    MakeGetMoviesQueryExamplesUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config).not.toHaveProperty("googleGeminiToken");
    expect(config).not.toHaveProperty("aiModelsFallback");
  });

  it("trata espaços como chave Gemini presente porque isEmptyString não faz trim", () => {
    envState.OPENROUTER_API_KEY = "";
    envState.GEMINI_API_KEY = "  ";

    MakeGetMoviesQueryExamplesUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config.googleGeminiToken).toBe("  ");
    expect(config.aiModelsFallback).toEqual([AiModels.GEMINI_FALLBACK]);
  });

  it("não referencia Langchain, FLASH_LITE nem cache:false no factory", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/factories/make-get-movies-query-examples-use-case.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");

    expect(factorySource).not.toMatch(/Langchain/);
    expect(factorySource).not.toMatch(/FLASH_LITE/);
    expect(factorySource).not.toMatch(/cache:\s*false/);
  });

  it("não inclui memory no config do AI", () => {
    MakeGetMoviesQueryExamplesUseCaseFactory.create();

    const config = aiConstructorCalls[0] as Record<string, unknown>;
    expect(config).not.toHaveProperty("memory");
  });

  it("não referencia lookupMovies nem catálogo TMDB no factory", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/factories/make-get-movies-query-examples-use-case.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");

    expect(factorySource).not.toMatch(/lookupMovies/);
    expect(factorySource).not.toMatch(/MovieCatalogLookup/);
    expect(factorySource).not.toMatch(/MakeTmdbHttpClientFactory/);
    expect(factorySource).not.toMatch(/createLookupMoviesTool/);
  });

  it("não injeta tool lookupMovies no provider de query examples", () => {
    const useCase = MakeGetMoviesQueryExamplesUseCaseFactory.create();
    const provider = (
      useCase as unknown as {
        movieQueryExampleProvider: AiMoviesQueryExamplesProvider;
      }
    ).movieQueryExampleProvider;
    const providerRecord = provider as unknown as Record<string, unknown>;

    expect(providerRecord.lookupMoviesTool).toBeUndefined();
    expect(providerRecord.tools).toBeUndefined();
  });
});
