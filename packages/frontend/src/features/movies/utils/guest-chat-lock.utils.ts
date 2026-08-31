import axios from "axios";

interface ShouldLockAfterSuccessParams {
  hasAccessToken: boolean;
  guestRemaining: number | null;
}

interface ShouldLockOnErrorParams {
  error: unknown;
  hasAccessToken: boolean;
}

export class GuestChatLockUtils {
  static shouldLockAfterSuccess(params: ShouldLockAfterSuccessParams): boolean {
    if (params.hasAccessToken) {
      return false;
    }

    return params.guestRemaining === 0;
  }

  static shouldLockOnError(params: ShouldLockOnErrorParams): boolean {
    if (params.hasAccessToken) {
      return false;
    }

    const error = params.error;
    if (!axios.isAxiosError(error)) {
      return false;
    }

    const status = error.response?.status;
    return status === 401;
  }
}
