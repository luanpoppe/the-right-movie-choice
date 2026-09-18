import axios from "axios";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export class SocialApiErrorUtils {
  static getGenericErrorMessage(): string {
    return GENERIC_ERROR_TOAST;
  }

  static getConflictOrGenericErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
      return GENERIC_ERROR_TOAST;
    }

    const statusCode = error.response?.status;
    const isConflict = statusCode === 409;
    if (!isConflict) {
      return GENERIC_ERROR_TOAST;
    }

    const apiError = error.response?.data?.error;
    if (typeof apiError === "string") {
      return apiError;
    }

    return GENERIC_ERROR_TOAST;
  }
}
