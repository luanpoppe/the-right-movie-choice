import { UserConversationIdParamsSchema } from "../user-conversation.dto";

describe("UserConversationIdParamsSchema", () => {
  it("aceita id numérico positivo como string na rota", () => {
    const parseResult = UserConversationIdParamsSchema.safeParse({ id: "12" });

    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.id).toBe(12);
    }
  });

  it("rejeita id inválido (zero, negativo ou não numérico)", () => {
    expect(UserConversationIdParamsSchema.safeParse({ id: "0" }).success).toBe(
      false,
    );
    expect(
      UserConversationIdParamsSchema.safeParse({ id: "-1" }).success,
    ).toBe(false);
    expect(
      UserConversationIdParamsSchema.safeParse({ id: "abc" }).success,
    ).toBe(false);
    expect(
      UserConversationIdParamsSchema.safeParse({ id: undefined }).success,
    ).toBe(false);
  });
});
