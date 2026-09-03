import { describe, it, expect } from "vitest";
import { FastifyRequest } from "fastify";
import {
  TmdbLoopbackForbiddenException,
  TmdbLoopbackGuard,
} from "@/modules/tmdb/infrastructure/http/tmdb-loopback.guard";

function createRequest(ip: string | undefined, socketIp?: string): FastifyRequest {
  return {
    ip,
    socket: { remoteAddress: socketIp },
  } as FastifyRequest;
}

describe("TmdbLoopbackGuard", () => {
  describe("isLoopbackAddress", () => {
    it.each(["127.0.0.1", "::1", "localhost", "::ffff:127.0.0.1"])(
      "accepts loopback address %s",
      (ip) => {
        expect(TmdbLoopbackGuard.isLoopbackAddress(ip)).toBe(true);
      },
    );

    it.each(["192.168.0.10", "8.8.8.8", "10.0.0.1", "172.16.1.1"])(
      "rejects non-loopback address %s",
      (ip) => {
        expect(TmdbLoopbackGuard.isLoopbackAddress(ip)).toBe(false);
      },
    );

    it("rejects undefined", () => {
      expect(TmdbLoopbackGuard.isLoopbackAddress(undefined)).toBe(false);
    });
  });

  describe("createPreHandler", () => {
    const preHandler = TmdbLoopbackGuard.createPreHandler();

    it.each(["127.0.0.1", "::1", "localhost", "::ffff:127.0.0.1"])(
      "allows request from %s",
      (ip) => {
        expect(() => preHandler(createRequest(ip))).not.toThrow();
      },
    );

    it("allows when request.ip is empty and socket is loopback", () => {
      expect(() =>
        preHandler(createRequest("", "::1")),
      ).not.toThrow();
    });

    it.each(["192.168.1.20", "203.0.113.10"])(
      "throws 403 for %s",
      (ip) => {
        expect(() => preHandler(createRequest(ip))).toThrow(
          TmdbLoopbackForbiddenException,
        );

        try {
          preHandler(createRequest(ip));
        } catch (error) {
          expect(error).toMatchObject({ statusCode: 403 });
        }
      },
    );

    it("throws 403 when ip is undefined", () => {
      expect(() => preHandler(createRequest(undefined))).toThrow(
        TmdbLoopbackForbiddenException,
      );
    });
  });
});
