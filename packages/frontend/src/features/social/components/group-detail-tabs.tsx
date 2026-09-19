import type { ReactNode } from "react";
import { useLocation } from "react-router";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GroupChatsTab } from "./group-chats-tab";

export interface GroupDetailTabsProps {
  groupId: number;
  detailsContent: ReactNode;
}

export function GroupDetailTabs({
  groupId,
  detailsContent,
}: GroupDetailTabsProps) {
  const location = useLocation();
  const locationState = location.state as { tab?: string } | null;
  const shouldOpenChatTab = locationState?.tab === "chat";
  const defaultTab = shouldOpenChatTab ? "chat" : "details";

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
      </TabsList>

      <TabsContent value="details">{detailsContent}</TabsContent>

      <TabsContent value="chat">
        <GroupChatsTab groupId={groupId} />
      </TabsContent>
    </Tabs>
  );
}
