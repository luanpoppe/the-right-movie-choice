import { describe, it, expect } from "vitest";
import { BaseException } from "@/core/exceptions/base.exception";
import { PrismaErrorMapper } from "./prisma-error.mapper";
import { PrismaUtil } from "@/shared/utils/prisma.util";

class TestDomainException extends BaseException {
  statusCode = 409;

  constructor() {
    super("test");
  }
}

describe("PrismaErrorMapper", () => {
  it("should throw the domain exception on P2002", () => {
    const prismaError = { code: PrismaUtil.UNIQUE_CONSTRAINT_CODE };

    expect(() =>
      PrismaErrorMapper.mapUniqueViolationOrRethrow(
        prismaError,
        new TestDomainException(),
      ),
    ).toThrow(TestDomainException);
  });

  it("should rethrow non-unique errors", () => {
    const otherError = new Error("connection failed");

    expect(() =>
      PrismaErrorMapper.mapUniqueViolationOrRethrow(
        otherError,
        new TestDomainException(),
      ),
    ).toThrow(otherError);
  });
});
