import { Redis } from "@/lib/redis/redis";
import { JoseAccessTokenProvider } from "@/modules/auth/infrastructure/providers/jose-access-token.provider";
import { GuestQuotaService } from "@/domains/movies/application/guest-quota.service";
import { RedisGuestQuotaRepository } from "../repositories/redis-guest-quota.repository";
import { MovieRecommendationAuthHook } from "../http/hooks/movie-recommendation-auth.hook";
import { MovieRecommendationController } from "../http/controllers/movie-recommendation.controller";

export class MakeMovieRecommendationHttpFactory {
  static create() {
    const accessTokenProvider = new JoseAccessTokenProvider();
    const redis = new Redis();
    const guestQuotaRepository = new RedisGuestQuotaRepository(redis);
    const guestQuotaService = new GuestQuotaService(guestQuotaRepository);

    const preHandler = MovieRecommendationAuthHook.createPreHandler({
      accessTokenProvider,
      guestQuotaService,
    });
    const controller = MovieRecommendationController.create(guestQuotaService);

    return { preHandler, controller };
  }
}
