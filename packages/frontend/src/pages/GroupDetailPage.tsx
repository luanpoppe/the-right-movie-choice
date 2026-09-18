import { Link, Navigate, useParams } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { SocialLoginRedirectUtils } from "@/features/social/utils/social-login-redirect.utils";
import { StringUtils } from "@/utils/string.utils";

const GROUP_DETAIL_LOGIN_REDIRECT = (id: string) =>
  SocialLoginRedirectUtils.buildRedirectPath(`/social/groups/${id}`);

function GroupDetailPageContent() {
  const { id } = useParams();
  const groupId = id ?? "";

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Group detail</h1>
        <p className="text-muted-foreground">
          Group {groupId} — coming soon
        </p>
        <Link to="/social" className="text-primary hover:underline">
          Back to Social
        </Link>
      </div>
    </div>
  );
}

export function GroupDetailPage() {
  const { accessToken } = useAuth();
  const { id } = useParams();
  const groupId = id ?? "";
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  if (!hasAccessToken) {
    const loginRedirect = GROUP_DETAIL_LOGIN_REDIRECT(groupId);
    return <Navigate to={loginRedirect} replace />;
  }

  return <GroupDetailPageContent />;
}
