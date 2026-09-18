import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CreateGroupForm } from "@/features/social/components/create-group-form";
import type { UserGroupListItemResponse } from "@/features/social/dto/user-groups.dto";
import { UserGroupsService } from "@/features/social/services/user-groups.service";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export class GroupsTabUtils {
  static formatJoinedAt(joinedAt: string): string {
    const datePart = joinedAt.slice(0, 10);
    return datePart;
  }

  static formatMemberCount(memberCount: number): string {
    const isSingular = memberCount === 1;
    if (isSingular) {
      return "1 member";
    }

    return `${memberCount} members`;
  }
}

export function GroupsTab() {
  const [groups, setGroups] = useState<UserGroupListItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const activeFetchIdRef = useRef(0);

  const fetchGroups = useCallback(async () => {
    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    setIsLoading(true);
    setHasLoadError(false);

    console.info("[GroupsTab] loading groups");

    try {
      const response = await UserGroupsService.listGroups();
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      setGroups(response);

      console.info("[GroupsTab] groups loaded", {
        count: response.length,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      console.error("[GroupsTab] failed to load groups", { error });
      setHasLoadError(true);
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      const isCurrentFetch = fetchId === activeFetchIdRef.current;
      if (isCurrentFetch) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  function handleRetry() {
    void fetchGroups();
  }

  function handleGroupCreated() {
    void fetchGroups();
  }

  const shouldShowEmptyState =
    !isLoading && !hasLoadError && groups.length === 0;
  const hasVisibleGroups = !isLoading && !hasLoadError && groups.length > 0;

  if (isLoading) {
    return (
      <div>
        <CreateGroupForm onCreated={handleGroupCreated} />
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (hasLoadError) {
    return (
      <div>
        <CreateGroupForm onCreated={handleGroupCreated} />
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Could not load your groups.</p>
          <Button type="button" variant="outline" onClick={handleRetry}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CreateGroupForm onCreated={handleGroupCreated} />

      {shouldShowEmptyState && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">
            You are not in any groups yet. Create one above to get started.
          </p>
        </div>
      )}

      {hasVisibleGroups && (
        <ul className="space-y-2">
          {groups.map((group) => {
            const groupPath = `/social/groups/${group.id}`;
            const joinedAtLabel = GroupsTabUtils.formatJoinedAt(group.joinedAt);
            const memberCountLabel = GroupsTabUtils.formatMemberCount(
              group.memberCount,
            );

            return (
              <li key={group.id}>
                <Link
                  to={groupPath}
                  className="block rounded-md border border-border/50 px-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <span className="block font-medium">{group.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {memberCountLabel} · Joined {joinedAtLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
