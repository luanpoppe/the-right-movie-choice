import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, AuthOrDivider } from "../components/AuthCard";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useAuth } from "../context/AuthContext";
import { AuthService } from "../services/auth.service";
import { getAuthErrorMessage } from "../utils/auth-error.util";

export class LoginRedirectUtils {
  static resolveRedirectPath(searchParams: URLSearchParams): string {
    const redirect = searchParams.get("redirect");
    const isMissingRedirect = redirect === null || redirect === "";
    if (isMissingRedirect) {
      return "/";
    }

    const isRelativePath = redirect.startsWith("/");
    const isProtocolRelative = redirect.startsWith("//");
    const isValidRedirect = isRelativePath && !isProtocolRelative;
    if (!isValidRedirect) {
      return "/";
    }

    return redirect;
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const redirectPath = LoginRedirectUtils.resolveRedirectPath(searchParams);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const tokens = await AuthService.login({ email, password });
      setAccessToken(tokens.accessToken);
      toast.success("Signed in successfully!");
      navigate(redirectPath);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Use your password or continue with Google."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <AuthOrDivider />

      <GoogleSignInButton redirectPath={redirectPath} />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="text-primary hover:underline">
          Create account
        </Link>
      </p>
    </AuthCard>
  );
}
