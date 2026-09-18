import { useState } from "react";
import { Navigate } from "react-router";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/context/AuthContext";
import { FriendsTab } from "@/features/social/components/friends-tab";
import { GroupsTab } from "@/features/social/components/groups-tab";
import { RequestsTab } from "@/features/social/components/requests-tab";
import { SocialLoginRedirectUtils } from "@/features/social/utils/social-login-redirect.utils";
import { StringUtils } from "@/utils/string.utils";

const SOCIAL_LOGIN_REDIRECT =
  SocialLoginRedirectUtils.buildRedirectPath("/social");

export type SocialTab = "friends" | "requests" | "groups";

function SocialPageContent() {
  const [activeTab, setActiveTab] = useState<SocialTab>("friends");

  function handleTabChange(value: string) {
    setActiveTab(value as SocialTab);
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Social</h1>
        <p className="text-muted-foreground">
          Manage your friends, requests, and groups.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <FriendsTab />
        </TabsContent>

        <TabsContent value="requests">
          <RequestsTab />
        </TabsContent>

        <TabsContent value="groups">
          <GroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SocialPage() {
  const { accessToken } = useAuth();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  if (hasAccessToken) {
    return <SocialPageContent />;
  }

  return <Navigate to={SOCIAL_LOGIN_REDIRECT} replace />;
}
