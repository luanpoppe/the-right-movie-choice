import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AuthService } from "../services/auth.service";
import { getAuthErrorMessage } from "../utils/auth-error.util";

interface GoogleSignInButtonProps {
  redirectPath?: string;
}

export function GoogleSignInButton({
  redirectPath = "/",
}: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) {
      toast.error("Could not obtain the Google token.");
      return;
    }

    try {
      const tokens = await AuthService.loginWithGoogle({
        idToken: credentialResponse.credential,
      });
      setAccessToken(tokens.accessToken);
      toast.success("Google sign-in successful!");
      navigate(redirectPath);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  function handleError() {
    toast.error("Failed to sign in with Google.");
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
