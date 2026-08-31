import { BaseException } from "@/core/exceptions/base.exception";

export class GuestQuotaExceededException extends BaseException {
  statusCode = 401;

  constructor() {
    super("Guest recommendation quota exceeded");
  }
}
