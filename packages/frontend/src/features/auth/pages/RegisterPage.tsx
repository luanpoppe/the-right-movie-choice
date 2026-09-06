import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { AuthService } from "../services/auth.service";
import { getAuthErrorMessage } from "../utils/auth-error.util";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const name = String(formData.get("name") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await AuthService.register({ email, name, password });
      const tokens = await AuthService.login({ email, password });
      setAccessToken(tokens.accessToken);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-6 rounded-2xl border border-border/50 bg-card/80 p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-muted-foreground">
            Sign up with a password or use Google on the same account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              disabled={isLoading}
            />
          </div>

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
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create account"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <GoogleSignInButton />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
