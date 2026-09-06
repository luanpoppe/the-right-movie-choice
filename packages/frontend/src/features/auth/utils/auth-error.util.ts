import axios from "axios";

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error;

    if (typeof apiError === "string") {
      return apiError;
    }
  }

  return "Could not complete authentication. Please try again.";
}
