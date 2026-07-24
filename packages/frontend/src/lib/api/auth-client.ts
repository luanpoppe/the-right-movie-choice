import axios from "axios";
import { env } from "@/utils/env";

export const authClient = axios.create({
  baseURL: env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
