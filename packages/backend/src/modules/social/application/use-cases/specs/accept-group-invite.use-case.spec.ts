import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupInviteEntity } from "../../../domain/entities/group-invite.entity";
import { GroupFullException } from "../../../domain/exceptions/group-full.exception";
import { GroupInviteNotFoundException } from "../../../domain/exceptions/group-invite-not-found.exception";
import type { IGroupInviteRepository } from "../../../domain/repositories/group-invite.repository";
import { AcceptGroupInviteUseCase } from "../accept-group-invite.use-case";

describe("AcceptGroupInviteUseCase", () => {
  const inviteeId = 12;
  const groupInviteId = 40;
  const groupId = 3;

  const pendingInvite: GroupInviteEntity = {
    id: groupInviteId,
    groupId,
    inviterId: 7,
    inviteeId,
    status: "pending",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let groupInviteRepository: IGroupInviteRepository;
  let useCase: AcceptGroupInviteUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    groupInviteRepository = {
      findById: vi.fn().mockResolvedValue(pendingInvite),
      findLatestPending: vi.fn(),
      createPending: vi.fn(),
      updateStatus: vi.fn(),
      deleteById: vi.fn(),
      listIncomingPending: vi.fn(),
      hasPendingInvite: vi.fn(),
      acceptPendingAndAddMember: vi.fn().mockResolvedValue({
        ...pendingInvite,
        status: "accepted",
      }),
      createPendingIfAvailable: vi.fn(),
    };

    useCase = new AcceptGroupInviteUseCase(groupInviteRepository);
  });

  it("REQ-4: convidado aceita convite pending e entra no grupo", async () => {
    const result = await useCase.execute(inviteeId, groupInviteId);

    expect(groupInviteRepository.findById).toHaveBeenCalledWith(groupInviteId);
    expect(groupInviteRepository.acceptPendingAndAddMember).toHaveBeenCalledWith(
      groupInviteId,
      groupId,
      inviteeId,
    );
    expect(result.status).toBe("accepted");
  });

  it("edge: convite inexistente lança GroupInviteNotFoundException", async () => {
    vi.mocked(groupInviteRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(inviteeId, groupInviteId)).rejects.toThrow(
      GroupInviteNotFoundException,
    );
    expect(groupInviteRepository.acceptPendingAndAddMember).not.toHaveBeenCalled();
  });

  it("REQ-15: outro usuário recebe GroupInviteNotFoundException", async () => {
    await expect(useCase.execute(99, groupInviteId)).rejects.toThrow(
      GroupInviteNotFoundException,
    );
    expect(groupInviteRepository.acceptPendingAndAddMember).not.toHaveBeenCalled();
  });

  it("edge: convite não-pending lança GroupInviteNotFoundException", async () => {
    vi.mocked(groupInviteRepository.findById).mockResolvedValue({
      ...pendingInvite,
      status: "rejected",
    });

    await expect(useCase.execute(inviteeId, groupInviteId)).rejects.toThrow(
      GroupInviteNotFoundException,
    );
    expect(groupInviteRepository.acceptPendingAndAddMember).not.toHaveBeenCalled();
  });

  it("edge: grupo cheio lança GroupFullException", async () => {
    vi.mocked(groupInviteRepository.acceptPendingAndAddMember).mockRejectedValue(
      new GroupFullException(),
    );

    await expect(useCase.execute(inviteeId, groupInviteId)).rejects.toThrow(
      GroupFullException,
    );
    expect(groupInviteRepository.acceptPendingAndAddMember).toHaveBeenCalledWith(
      groupInviteId,
      groupId,
      inviteeId,
    );
  });

  it("edge: aceite usa método transacional do repositório", async () => {
    await useCase.execute(inviteeId, groupInviteId);

    expect(groupInviteRepository.acceptPendingAndAddMember).toHaveBeenCalledTimes(1);
    expect(groupInviteRepository.updateStatus).not.toHaveBeenCalled();
  });
});
