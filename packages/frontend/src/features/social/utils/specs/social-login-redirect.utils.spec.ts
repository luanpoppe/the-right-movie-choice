import { SocialLoginRedirectUtils } from "../social-login-redirect.utils";

describe("SocialLoginRedirectUtils.buildRedirectPath", () => {
  it("REQ-2: monta redirect para /social", () => {
    const redirectPath = SocialLoginRedirectUtils.buildRedirectPath("/social");

    expect(redirectPath).toBe("/login?redirect=/social");
  });

  it("REQ-2: monta redirect para detalhe de grupo", () => {
    const redirectPath =
      SocialLoginRedirectUtils.buildRedirectPath("/social/groups/3");

    expect(redirectPath).toBe("/login?redirect=/social/groups/3");
  });
});
