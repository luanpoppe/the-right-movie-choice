import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupInviteEntity } from "../../../domain/entities/group-invite.entity";
import { GroupInviteNotFoundException } from "../../../domain/exceptions/group-invite-not-found.exception";
import type { IGroupInviteRepository } from "../../../domain/repositories/group-invite.repository";
import { RejectGroupInviteUseCase } from "../reject-group-invite.use-case";

describe("RejectGroupInviteUseCase", () => {
  const inviteeId = 12;
  const groupInviteId = 40;

  const pendingInvite: GroupInviteEntity = {
    id: groupInviteId,
    groupId: 3,
    inviterId: 7,
    inviteeId,
    status: "pending",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let groupInviteRepository: IGroupInviteRepository;
  let useCase: RejectGroupInviteUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    groupInviteRepository = {
      findById: vi.fn().mockResolvedValue(pendingInvite),
      findLatestPending: vi.fn(),
      createPending: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({
        ...pendingInvite,
        status: "rejected",
      }),
      deleteById: vi.fn(),
      listIncomingPending: vi.fn(),
      hasPendingInvite: vi.fn(),
      acceptPendingAndAddMember: vi.fn(),
      createPendingIfAvailable: vi.fn(),
    };

    useCase = new RejectGroupInviteUseCase(groupInviteRepository);
  });

  it("REQ-5: convidado recusa convite pending", async () => {
    const result = await useCase.execute(inviteeId, groupInviteId);

    expect(groupInviteRepository.updateStatus).toHaveBeenCalledWith(
      groupInviteId,
      "rejected",
    );
    expect(result.status).toBe("rejected");
  });

  it("REQ-5: recusa não adiciona membro ao grupo", async () => {
    const result = await useCase.execute(inviteeId, groupInviteId);

    expect(result.status).toBe("rejected");
    expect(groupInviteRepository.updateStatus).toHaveBeenCalledTimes(1);
  });

  it("edge: convite inexistente lança GroupInviteNotFoundException", async () => {
    vi.mocked(groupInviteRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(inviteeId, groupInviteId)).rejects.toThrow(
      GroupInviteNotFoundException,
    );
    expect(groupInviteRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("REQ-15: outro usuário recebe GroupInviteNotFoundException", async () => {
    await expect(useCase.execute(99, groupInviteId)).rejects.toThrow(
      GroupInviteNotFoundException,
    );
    expect(groupInviteRepository.updateStatus).not.toHaveBeenCalled();
  });
});
