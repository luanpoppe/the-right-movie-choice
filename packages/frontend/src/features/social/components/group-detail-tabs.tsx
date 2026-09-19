import type { ReactNode } from "react";
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
  return (
    <Tabs defaultValue="details">
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
