export class ErrorUtils {
  static message(error: unknown): string {
    const isErrorInstance = error instanceof Error;
    if (isErrorInstance) {
      return error.message;
    }

    return String(error);
  }
}
