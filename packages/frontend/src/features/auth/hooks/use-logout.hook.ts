import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { AuthService } from "../services/auth.service";

// Centraliza o logout para o header desktop e o menu mobile usarem o mesmo
// comportamento (limpar a sessao mesmo se o servidor falhar).
export function useLogout() {
  const { clearSession } = useAuth();

  async function logout() {
    try {
      await AuthService.logout();
      clearSession();
      toast.success("Signed out.");
    } catch {
      clearSession();
      toast.error("Could not sign out on the server.");
    }
  }

  return logout;
}
