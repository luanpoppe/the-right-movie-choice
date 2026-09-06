import { useCallback, useState } from "react";
import toast from "react-hot-toast";

export function useIsLoading<T = any>(callback: () => Promise<T>) {
  const [isLoading, setIsLoading] = useState(false);

  const request = useCallback(async () => {
    setIsLoading(true);
    try {
      await callback();
      setIsLoading(false);
    } catch (error: any) {
      toast.error("Something didn't go as expected!");
      console.log(
        "error: ",
        error.status?.toString() ?? error,
        error.response?.data
      );
      setIsLoading(false);
    }
  }, [callback]);

  return { isLoading, request };
}
