import { BaseException } from "@/core/exceptions/base.exception";

export class GoogleEmailNotVerifiedException extends BaseException {
  statusCode = 401;

  constructor() {
    super("Google account email is not verified");
  }
}
