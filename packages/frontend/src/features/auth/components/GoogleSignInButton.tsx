import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AuthService } from "../services/auth.service";
import { getAuthErrorMessage } from "../utils/auth-error.util";

export function GoogleSignInButton() {
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) {
      toast.error("Não foi possível obter o token do Google.");
      return;
    }

    try {
      const tokens = await AuthService.loginWithGoogle({
        idToken: credentialResponse.credential,
      });
      setAccessToken(tokens.accessToken);
      toast.success("Autenticação com Google realizada!");
      navigate("/");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  function handleError() {
    toast.error("Falha ao autenticar com o Google.");
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}
