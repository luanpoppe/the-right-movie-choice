import { BaseException } from "@/exceptions/base.exception";

export class WrongMovieSchemaFromLlmException extends BaseException {
  constructor() {
    super("The LLM didn't answered in the correct strctured way");
  }
  statusCode = 500;
}
