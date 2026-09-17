import { ConversationBootstrapUtils } from "../conversation-bootstrap.utils";

describe("ConversationBootstrapUtils", () => {
  const bootstrap = {
    userMessage: "sci-fi thriller",
    response: "Here are three picks.",
    movies: [
      {
        title: "Blade Runner",
        director: "Ridley Scott",
        actors: ["Harrison Ford"],
        releaseYear: 1982,
        streamingPlatform: "Netflix",
        imdbRating: 8.1,
        synopsis: "Neo-noir sci-fi.",
        whySuggestion: "Classic.",
        durationInMinutes: 117,
      },
    ],
  };

  it("buildMessagesFromBootstrap monta user + ai quando histórico da API está vazio", () => {
    const messages = ConversationBootstrapUtils.buildMessagesFromBootstrap(
      bootstrap,
    );

    expect(messages).toEqual([
      { from: "user", message: "sci-fi thriller" },
      {
        from: "ai",
        message: "Here are three picks.",
        movies: bootstrap.movies,
      },
    ]);
  });

  it("resolveInitialMessages usa bootstrap quando API retorna histórico vazio", () => {
    const messages = ConversationBootstrapUtils.resolveInitialMessages(
      [],
      bootstrap,
    );

    expect(messages).toHaveLength(2);
    expect(messages[0]?.from).toBe("user");
    expect(messages[1]?.movies).toEqual(bootstrap.movies);
  });

  it("resolveInitialMessages enriquece movies quando histórico já tem texto da IA", () => {
    const persistedMessages = [
      { from: "user" as const, message: "sci-fi thriller" },
      { from: "ai" as const, message: "Here are three picks." },
    ];

    const messages = ConversationBootstrapUtils.resolveInitialMessages(
      persistedMessages,
      bootstrap,
    );

    expect(messages[1]?.movies).toEqual(bootstrap.movies);
  });
});
