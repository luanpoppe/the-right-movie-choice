import { BaseException } from "@/core/exceptions/base.exception";
import { PrismaUtil } from "@/shared/utils/prisma.util";

export class PrismaErrorMapper {
  /**
   * Converts a Prisma unique constraint violation (P2002) into a domain exception.
   * Rethrows the original error when it is not a unique violation.
   */
  static mapUniqueViolationOrRethrow(
    error: unknown,
    uniqueViolationException: BaseException,
  ): never {
    if (PrismaUtil.isUniqueConstraintViolation(error)) {
      throw uniqueViolationException;
    }

    throw error;
  }
}
