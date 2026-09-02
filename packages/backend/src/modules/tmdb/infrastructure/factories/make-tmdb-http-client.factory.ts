import {
  TmdbHttpClient,
  TmdbHttpClientParams,
} from "@/modules/tmdb/infrastructure/http/tmdb-http.client";

export class MakeTmdbHttpClientFactory {
  static create(params?: TmdbHttpClientParams) {
    const client = new TmdbHttpClient(params);
    return client;
  }
}
