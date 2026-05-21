import { BaseException } from "./base.exception";

export class MissingHeaderException extends BaseException {
  constructor(headerName?: string) {
    super(
      `The headers are missing a header${headerName ? `: ${headerName}.` : "."}`
    );
  }

  statusCode = 400;
}
