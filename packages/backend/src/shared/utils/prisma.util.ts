export class PrismaUtil {
  static readonly UNIQUE_CONSTRAINT_CODE = "P2002";
  static readonly RECORD_NOT_FOUND_CODE = "P2025";

  static isUniqueConstraintViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === PrismaUtil.UNIQUE_CONSTRAINT_CODE
    );
  }

  static isRecordNotFound(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === PrismaUtil.RECORD_NOT_FOUND_CODE
    );
  }
}
