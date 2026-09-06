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

  async getString(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async mgetStrings(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];

    const values = await this.client.mget(...keys);
    return values;
  }

  async setManyWithExpiration(
    entries: Array<{ key: string; value: any }>,
    expirationInSeconds: number,
  ): Promise<void> {
    if (entries.length === 0) return;

    const pipeline = this.client.pipeline();

    for (const entry of entries) {
      const serializedValue = this.serializeValue(entry.value);
      pipeline.set(entry.key, serializedValue, "EX", expirationInSeconds);
    }

    await pipeline.exec();
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  private serializeValue(value: any): string {
    if (typeof value === "string") return value;
    if (typeof value === "object") return JSON.stringify(value);
    throw new Error("Wrong value passed into redis");
  }
}
