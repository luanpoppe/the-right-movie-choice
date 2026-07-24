export class PrismaUtil {
  static readonly UNIQUE_CONSTRAINT_CODE = "P2002";

  static isUniqueConstraintViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === PrismaUtil.UNIQUE_CONSTRAINT_CODE
    );
  }
}
