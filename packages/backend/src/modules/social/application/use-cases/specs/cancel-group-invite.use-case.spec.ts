import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupInviteEntity } from "../../../domain/entities/group-invite.entity";
import { GroupInviteNotFoundException } from "../../../domain/exceptions/group-invite-not-found.exception";
import type { IGroupInviteRepository } from "../../../domain/repositories/group-invite.repository";
import { CancelGroupInviteUseCase } from "../cancel-group-invite.use-case";

describe("CancelGroupInviteUseCase", () => {
  const inviterId = 7;
  const groupInviteId = 41;

  const pendingInvite: GroupInviteEntity = {
    id: groupInviteId,
    groupId: 3,
    inviterId,
    inviteeId: 12,
    status: "pending",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let groupInviteRepository: IGroupInviteRepository;
  let useCase: CancelGroupInviteUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    groupInviteRepository = {
      findById: vi.fn().mockResolvedValue(pendingInvite),
      findLatestPending: vi.fn(),
      createPending: vi.fn(),
      updateStatus: vi.fn(),
      deleteById: vi.fn().mockResolvedValue(undefined),
      listIncomingPending: vi.fn(),
      hasPendingInvite: vi.fn(),
      acceptPendingAndAddMember: vi.fn(),
      createPendingIfAvailable: vi.fn(),
    };

    useCase = new CancelGroupInviteUseCase(groupInviteRepository);
  });

  it("REQ-6: remetente cancela convite pending", async () => {
    await useCase.execute(inviterId, groupInviteId);

    expect(groupInviteRepository.deleteById).toHaveBeenCalledWith(
      groupInviteId,
    );
  });

  it("edge: convite inexistente lança GroupInviteNotFoundException", async () => {
    vi.mocked(groupInviteRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(inviterId, groupInviteId)).rejects.toThrow(
      GroupInviteNotFoundException,
    );
    expect(groupInviteRepository.deleteById).not.toHaveBeenCalled();
  });

  it("REQ-15: outro usuário recebe GroupInviteNotFoundException", async () => {
    await expect(useCase.execute(99, groupInviteId)).rejects.toThrow(
      GroupInviteNotFoundException,
    );
    expect(groupInviteRepository.deleteById).not.toHaveBeenCalled();
  });

  it("edge: convite não-pending não pode ser cancelado", async () => {
    vi.mocked(groupInviteRepository.findById).mockResolvedValue({
      ...pendingInvite,
      status: "accepted",
    });

    await expect(useCase.execute(inviterId, groupInviteId)).rejects.toThrow(
      GroupInviteNotFoundException,
    );
    expect(groupInviteRepository.deleteById).not.toHaveBeenCalled();
  });
});
