import { BaseException } from "@/core/exceptions/base.exception";

export class TmdbHttpException extends BaseException {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
