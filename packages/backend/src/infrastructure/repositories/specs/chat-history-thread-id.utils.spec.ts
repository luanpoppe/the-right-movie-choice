import { describe, it, expect } from "vitest";
import { ChatHistoryThreadIdUtils } from "../chat-history-thread-id.utils";

describe("ChatHistoryThreadIdUtils", () => {
  const chatId = "110fb323-5579-485d-9cd1-d5ad12a61bd2";

  it("monta threadId de rodada exclude-watched", () => {
    const threadId = ChatHistoryThreadIdUtils.buildExcludeRoundThreadId(chatId, 2);

    expect(threadId).toBe(`${chatId}:exclude:2`);
  });

  it("lista threadIds para purge incluindo chatId base e rodadas exclude", () => {
    const threadIds = ChatHistoryThreadIdUtils.buildDeletionThreadIds(chatId);

    expect(threadIds).toEqual([
      chatId,
      `${chatId}:exclude:1`,
      `${chatId}:exclude:2`,
      `${chatId}:exclude:3`,
      `${chatId}:exclude:4`,
      `${chatId}:exclude:5`,
    ]);
  });

  it("lista candidatos de leitura com chatId base e rodadas exclude em ordem decrescente", () => {
    const threadIds = ChatHistoryThreadIdUtils.buildReadCandidateThreadIds(chatId);

    expect(threadIds).toEqual([
      chatId,
      `${chatId}:exclude:5`,
      `${chatId}:exclude:4`,
      `${chatId}:exclude:3`,
      `${chatId}:exclude:2`,
      `${chatId}:exclude:1`,
    ]);
  });
});
