import { IMovieCatalogProvider } from "@/domains/movies/application/providers/movie-catalog.provider";
import { MovieCatalogLookupTool } from "@/domains/movies/infrastructure/providers/movie-catalog-lookup.tool";

type Params = {
  catalog: IMovieCatalogProvider;
};

export class MakeMovieCatalogLookupToolFactory {
  static create(params: Params): MovieCatalogLookupTool {
    const tool = new MovieCatalogLookupTool(params.catalog);
    return tool;
  }
}
