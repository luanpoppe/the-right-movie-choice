import { env } from "@/env";
import { Redis as IORedis } from "ioredis";

export class Redis {
  client = new IORedis(env.REDIS_URL);

  async set(key: string, value: any) {
    if (typeof value === "string") await this.client.set(key, value);
    else if (typeof value === "object")
      await this.client.set(key, JSON.stringify(value));
    else throw new Error("Wrong value passed into redis");
  }

  async setWithExpiration(
    key: string,
    value: any,
    expirationInSeconds: number
  ) {
    if (typeof value === "string")
      await this.client.set(key, value, "EX", expirationInSeconds);
    else if (typeof value === "object")
      await this.client.set(
        key,
        JSON.stringify(value),
        "EX",
        expirationInSeconds
      );
    else throw new Error("Wrong value passed into redis");
  }

  async get(key: string) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : [];
  }
}
