import { FormEvent, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateUserGroupDTO } from "@/features/social/dto/user-groups.dto";
import { UserGroupConstants } from "@/features/social/dto/user-groups.dto";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { cn } from "@/lib/utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

export interface CreateGroupFormProps {
  onCreated: () => void;
}

export class CreateGroupFormUtils {
  static buildCreatePayload(
    name: string,
    description: string,
  ): CreateUserGroupDTO {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const payload: CreateUserGroupDTO = { name: trimmedName };

    const hasDescription = trimmedDescription.length > 0;
    if (hasDescription) {
      payload.description = trimmedDescription;
    }

    return payload;
  }
}

export function CreateGroupForm({ onCreated }: CreateGroupFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const description = String(formData.get("description") ?? "");
    const payload = CreateGroupFormUtils.buildCreatePayload(name, description);

    setIsSubmitting(true);

    console.info("[CreateGroupForm] creating group", {
      name: payload.name,
      hasDescription: payload.description !== undefined,
    });

    try {
      await UserGroupsService.create(payload);
      toast.success("Group created successfully.");
      formRef.current?.reset();
      onCreated();

      console.info("[CreateGroupForm] group created");
    } catch (error) {
      console.error("[CreateGroupForm] failed to create group", { error });
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      setIsSubmitting(false);
    }
  }

  const textareaClassName = cn(
    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  );

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mb-8 space-y-4 rounded-lg border border-border/50 bg-card/50 p-4"
    >
      <h2 className="text-lg font-semibold">Create a group</h2>

      <div className="space-y-2">
        <Label htmlFor="group-name">Name</Label>
        <Input
          id="group-name"
          name="name"
          type="text"
          required
          maxLength={UserGroupConstants.MAX_GROUP_NAME_LENGTH}
          disabled={isSubmitting}
          placeholder="Movie Club"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-description">Description (optional)</Label>
        <textarea
          id="group-description"
          name="description"
          maxLength={UserGroupConstants.MAX_GROUP_DESCRIPTION_LENGTH}
          disabled={isSubmitting}
          placeholder="Weekly movie picks with friends"
          className={textareaClassName}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create group"}
      </Button>
    </form>
  );
}
