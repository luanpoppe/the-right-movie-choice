import { BaseException } from "@/core/exceptions/base.exception";

export class MovieRecommendationTimeoutException extends BaseException {
  constructor(timeoutMs: number) {
    super(
      `Movie recommendation AI call timed out after ${timeoutMs}ms`,
    );
  }

  statusCode = 504;
}
