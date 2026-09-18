export class SocialLoginRedirectUtils {
  static buildRedirectPath(originalPath: string): string {
    const loginRedirectPath = `/login?redirect=${originalPath}`;

    return loginRedirectPath;
  }
}
