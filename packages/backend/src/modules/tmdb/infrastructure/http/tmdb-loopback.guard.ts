import { FastifyRequest } from "fastify";
import { BaseException } from "@/core/exceptions/base.exception";
import { Logger } from "@/lib/logger/logger";

const IPV4_MAPPED_PREFIXES = ["::ffff:", ":ffff:"] as const;
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "localhost"]);

export class TmdbLoopbackForbiddenException extends BaseException {
  statusCode = 403;

  constructor() {
    super("TMDB debug endpoints are only allowed from loopback");
  }
}

export class TmdbLoopbackGuard {
  static createPreHandler() {
    return (request: FastifyRequest): void => {
      const requestIp = request.ip;
      const socketIp = request.socket.remoteAddress;
      const ip = requestIp || socketIp;

      if (TmdbLoopbackGuard.isLoopbackAddress(ip)) {
        Logger.debug("TMDB debug request allowed from loopback", { ip });
        return;
      }

      Logger.warn("TMDB debug request rejected: remote IP is not loopback", {
        ip,
      });
      throw new TmdbLoopbackForbiddenException();
    };
  }

  static isLoopbackAddress(ip: string | undefined): boolean {
    if (!ip) {
      return false;
    }

    const normalized = TmdbLoopbackGuard.normalizeAddress(ip);
    if (!normalized) {
      return false;
    }

    return LOOPBACK_ADDRESSES.has(normalized);
  }

  private static normalizeAddress(ip: string): string {
    let value = ip.trim().toLowerCase();
    if (!value) {
      return "";
    }

    const zoneIndex = value.indexOf("%");
    if (zoneIndex >= 0) {
      value = value.slice(0, zoneIndex);
    }

    const hasBrackets = value.startsWith("[") && value.endsWith("]");
    if (hasBrackets) {
      value = value.slice(1, -1);
    }

    for (const prefix of IPV4_MAPPED_PREFIXES) {
      if (!value.startsWith(prefix)) {
        continue;
      }

      value = value.slice(prefix.length);
      break;
    }

    return value;
  }
}
