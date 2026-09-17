import { ConversationTitleUtils } from "../conversation-title.utils";

describe("ConversationTitleUtils.formatDisplayTitle", () => {
  const updatedAt = "2026-03-15T12:00:00.000Z";

  it("REQ-3: título customizado retorna valor trimado", () => {
    const displayTitle = ConversationTitleUtils.formatDisplayTitle(
      "  Sci-fi picks  ",
      updatedAt,
    );

    expect(displayTitle).toBe("Sci-fi picks");
  });

  it("REQ-3: título null exibe New Conversation com tempo relativo em inglês", () => {
    const displayTitle = ConversationTitleUtils.formatDisplayTitle(
      null,
      updatedAt,
    );

    expect(displayTitle).toMatch(/^New Conversation · .+/);
    expect(displayTitle).not.toContain("Nova");
  });

  it("edge: título vazio ou só espaços usa label padrão com tempo relativo", () => {
    const emptyTitle = ConversationTitleUtils.formatDisplayTitle("", updatedAt);
    const whitespaceTitle = ConversationTitleUtils.formatDisplayTitle(
      "   ",
      updatedAt,
    );

    expect(emptyTitle).toMatch(/^New Conversation · .+/);
    expect(whitespaceTitle).toMatch(/^New Conversation · .+/);
  });
});

describe("ConversationTitleUtils.canSubmitRename", () => {
  it("edge: renomear com título vazio não pode ser enviado", () => {
    expect(ConversationTitleUtils.canSubmitRename("")).toBe(false);
    expect(ConversationTitleUtils.canSubmitRename("   ")).toBe(false);
  });

  it("permite renomear quando há conteúdo após trim", () => {
    expect(ConversationTitleUtils.canSubmitRename("  My title  ")).toBe(true);
  });
});

describe("ConversationTitleUtils.normalizeRenameValue", () => {
  it("aplica trim no valor de rename", () => {
    expect(ConversationTitleUtils.normalizeRenameValue("  trimmed  ")).toBe(
      "trimmed",
    );
  });
});

describe("ConversationTitleUtils.shouldSkipRename", () => {
  it("edge: pula rename quando título normalizado está vazio", () => {
    expect(ConversationTitleUtils.shouldSkipRename("Old title", "   ")).toBe(
      true,
    );
  });

  it("pula rename quando título não mudou", () => {
    expect(
      ConversationTitleUtils.shouldSkipRename("Same title", "Same title"),
    ).toBe(true);
    expect(
      ConversationTitleUtils.shouldSkipRename(null, ""),
    ).toBe(true);
  });

  it("não pula rename quando título mudou de fato", () => {
    expect(
      ConversationTitleUtils.shouldSkipRename("Old title", "New title"),
    ).toBe(false);
    expect(
      ConversationTitleUtils.shouldSkipRename(null, "First title"),
    ).toBe(false);
  });
});
