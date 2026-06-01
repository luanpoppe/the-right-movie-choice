import axios from "axios";

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error;

    if (typeof apiError === "string") {
      return apiError;
    }
  }

  return "Não foi possível concluir a autenticação. Tente novamente.";
}
