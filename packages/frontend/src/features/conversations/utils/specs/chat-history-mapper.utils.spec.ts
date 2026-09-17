import type { ChatHistoryEntity } from "../../dto/user-conversation.dto";
import { ChatHistoryMapperUtils } from "../chat-history-mapper.utils";

describe("ChatHistoryMapperUtils.toChatEntity", () => {
  it("REQ-9: mapeia mensagens user e ai para ChatEntity", () => {
    const history: ChatHistoryEntity = [
      ["user", "I want a thriller"],
      ["ai", "Try these movies"],
    ];

    const chat = ChatHistoryMapperUtils.toChatEntity(history);

    expect(chat).toEqual([
      { from: "user", message: "I want a thriller" },
      { from: "ai", message: "Try these movies" },
    ]);
  });

  it("REQ-9: ignora mensagens system no histórico", () => {
    const history: ChatHistoryEntity = [
      ["system", "You are a movie assistant"],
      ["user", "Hello"],
      ["ai", "Hi there"],
    ];

    const chat = ChatHistoryMapperUtils.toChatEntity(history);

    expect(chat).toEqual([
      { from: "user", message: "Hello" },
      { from: "ai", message: "Hi there" },
    ]);
  });

  it("REQ-9: propaga movies quando presentes na tupla ai", () => {
    const movies = [
      {
        title: "Blade Runner",
        director: "Ridley Scott",
        actors: ["Harrison Ford"],
        releaseYear: 1982,
        streamingPlatform: "Netflix",
        imdbRating: 8.1,
        synopsis: "A detective hunts replicants.",
        whySuggestion: "Classic sci-fi noir.",
        durationInMinutes: 117,
      },
    ];
    const history: ChatHistoryEntity = [
      ["user", "sci-fi"],
      ["ai", "Try Blade Runner", movies],
    ];

    const chat = ChatHistoryMapperUtils.toChatEntity(history);

    expect(chat).toEqual([
      { from: "user", message: "sci-fi" },
      { from: "ai", message: "Try Blade Runner", movies },
    ]);
  });

  it("REQ-9: histórico vazio retorna array vazio", () => {
    const chat = ChatHistoryMapperUtils.toChatEntity([]);

    expect(chat).toEqual([]);
  });
});
