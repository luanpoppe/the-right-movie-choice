import { authClient } from "@/lib/api/auth-client";
import {
  AuthTokensResponse,
  GoogleAuthRequest,
  LoginRequest,
  RegisterRequest,
} from "../dto/auth.dto";

export class AuthService {
  static async login(data: LoginRequest): Promise<AuthTokensResponse> {
    const response = await authClient.post<AuthTokensResponse>(
      "/auth/login",
      data,
    );
    return response.data;
  }

  static async register(data: RegisterRequest): Promise<void> {
    await authClient.post("/users/register", data);
  }

  static async loginWithGoogle(data: GoogleAuthRequest): Promise<AuthTokensResponse> {
    const response = await authClient.post<AuthTokensResponse>(
      "/auth/google",
      data,
    );
    return response.data;
  }

  static async refresh(): Promise<AuthTokensResponse> {
    const response = await authClient.post<AuthTokensResponse>("/auth/refresh");
    return response.data;
  }

  static async logout(): Promise<void> {
    await authClient.post("/auth/logout");
  }
}
