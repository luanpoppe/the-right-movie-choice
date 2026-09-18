import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IncomingGroupInviteEntity } from "../../../domain/entities/group-invite.entity";
import type { IGroupInviteRepository } from "../../../domain/repositories/group-invite.repository";
import { ListIncomingGroupInvitesUseCase } from "../list-incoming-group-invites.use-case";

describe("ListIncomingGroupInvitesUseCase", () => {
  const inviteeId = 12;

  const incomingInvites: IncomingGroupInviteEntity[] = [
    {
      id: 40,
      group: { id: 3, name: "Sábado cinema" },
      inviter: { id: 7, name: "João", email: "joao@example.com" },
      status: "pending",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
    },
    {
      id: 42,
      group: { id: 5, name: "Domingo série" },
      inviter: { id: 15, name: "Ana", email: "ana@example.com" },
      status: "pending",
      createdAt: new Date("2026-03-02T10:00:00.000Z"),
    },
  ];

  let groupInviteRepository: IGroupInviteRepository;
  let useCase: ListIncomingGroupInvitesUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    groupInviteRepository = {
      findById: vi.fn(),
      findLatestPending: vi.fn(),
      createPending: vi.fn(),
      updateStatus: vi.fn(),
      deleteById: vi.fn(),
      listIncomingPending: vi.fn().mockResolvedValue(incomingInvites),
      hasPendingInvite: vi.fn(),
      acceptPendingAndAddMember: vi.fn(),
      createPendingIfAvailable: vi.fn(),
    };

    useCase = new ListIncomingGroupInvitesUseCase(groupInviteRepository);
  });

  it("REQ-12: retorna convites pending recebidos pelo usuário", async () => {
    const result = await useCase.execute(inviteeId);

    expect(groupInviteRepository.listIncomingPending).toHaveBeenCalledWith(
      inviteeId,
    );
    expect(result).toEqual(incomingInvites);
    expect(result).toHaveLength(2);
    expect(result[0]?.group.id).toBe(3);
    expect(result[1]?.group.id).toBe(5);
  });

  it("edge: retorna array vazio quando não há convites", async () => {
    vi.mocked(groupInviteRepository.listIncomingPending).mockResolvedValue([]);

    const result = await useCase.execute(inviteeId);

    expect(result).toEqual([]);
  });
});
