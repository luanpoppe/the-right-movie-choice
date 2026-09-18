import axios from "axios";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FriendshipService } from "../services/friendship.service";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

const FRIEND_REQUEST_SENT_TOAST = "Friend request sent.";

interface AddFriendFormProps {
  onSent?: () => void;
}

export class AddFriendFormUtils {
  static getSendFriendRequestErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
      return GENERIC_ERROR_TOAST;
    }

    const statusCode = error.response?.status;
    const isConflict = statusCode === 409;
    if (!isConflict) {
      return GENERIC_ERROR_TOAST;
    }

    const apiError = error.response?.data?.error;
    if (typeof apiError === "string") {
      return apiError;
    }

    return GENERIC_ERROR_TOAST;
  }
}

export function AddFriendForm({ onSent }: AddFriendFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const isEmailEmpty = trimmedEmail.length === 0;
    if (isEmailEmpty) {
      return;
    }

    setIsSubmitting(true);

    console.info("[AddFriendForm] sending friend request", {
      email: trimmedEmail,
    });

    try {
      await FriendshipService.sendFriendRequest(trimmedEmail);
      toast.success(FRIEND_REQUEST_SENT_TOAST);
      setEmail("");

      console.info("[AddFriendForm] friend request sent", {
        email: trimmedEmail,
      });

      if (onSent) {
        onSent();
      }
    } catch (error) {
      const errorMessage =
        AddFriendFormUtils.getSendFriendRequestErrorMessage(error);

      console.error("[AddFriendForm] failed to send friend request", {
        email: trimmedEmail,
        error,
      });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-2">
        <label htmlFor="add-friend-email" className="text-sm font-medium">
          Add friend by email
        </label>
        <Input
          id="add-friend-email"
          type="email"
          name="email"
          placeholder="friend@example.com"
          value={email}
          onChange={handleEmailChange}
          disabled={isSubmitting}
          autoComplete="off"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        Send request
      </Button>
    </form>
  );
}
