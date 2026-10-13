import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/list-skeleton";
import { CreateGroupForm } from "@/features/social/components/create-group-form";
import type { UserGroupListItemResponse } from "@/features/social/dto/user-groups.dto";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { cn, focusRingClassName } from "@/lib/utils";

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  function handleToggleCreate() {
    setIsCreateOpen((isOpen) => !isOpen);
  }

  function handleGroupCreated() {
    setIsCreateOpen(false);
    void fetchGroups();
  }

  const shouldShowEmptyState =
    !isLoading && !hasLoadError && groups.length === 0;
  const hasVisibleGroups = !isLoading && !hasLoadError && groups.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Groups you are part of
        </p>
        <Button
          type="button"
          variant={isCreateOpen ? "outline" : "default"}
          onClick={handleToggleCreate}
          aria-expanded={isCreateOpen}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {isCreateOpen ? "Cancel" : "New group"}
        </Button>
      </div>

      {isCreateOpen && <CreateGroupForm onCreated={handleGroupCreated} />}

      {isLoading && <ListSkeleton label="Loading your groups..." />}

      {hasLoadError && !isLoading && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Could not load your groups.</p>
          <Button type="button" variant="outline" onClick={handleRetry}>
            Try again
          </Button>
        </div>
      )}

      {shouldShowEmptyState && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
            <Users className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="font-display text-lg font-semibold tracking-tight">
              You are not in any groups yet
            </p>
            <p className="text-sm text-muted-foreground">
              Use New group to create your first one and pick movies together.
            </p>
          </div>
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
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-secondary/40",
                    focusRingClassName,
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Users className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-semibold tracking-tight">
                      {group.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {memberCountLabel} · Joined {joinedAtLabel}
                    </span>
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
