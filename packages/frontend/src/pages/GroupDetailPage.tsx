import { Navigate, useParams } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { GroupDetailPanel } from "@/features/social/components/group-detail-panel";
import { SocialLoginRedirectUtils } from "@/features/social/utils/social-login-redirect.utils";
import { StringUtils } from "@/utils/string.utils";

const GROUP_DETAIL_LOGIN_REDIRECT = (id: string) =>
  SocialLoginRedirectUtils.buildRedirectPath(`/social/groups/${id}`);

function GroupDetailPageContent() {
  const { id } = useParams();
  const groupId = id ?? "";

  return (
    <div className="container mx-auto px-6 py-8">
      <GroupDetailPanel groupId={groupId} />
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
