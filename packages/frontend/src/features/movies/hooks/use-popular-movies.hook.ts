import { useEffect, useState } from "react";
import { PopularMovie } from "../dto/popular-movies.dto";
import { PopularMoviesService } from "../services/popular-movies.service";

interface UsePopularMoviesResult {
  movies: PopularMovie[];
  isLoading: boolean;
}

export function usePopularMovies(): UsePopularMoviesResult {
  const [movies, setMovies] = useState<PopularMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const response = await PopularMoviesService.getPopularMovies();
        if (!isActive) {
          return;
        }
        setMovies(response.movies);
      } catch (error) {
        console.error("Error fetching popular movies", { error });
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, []);

  return { movies, isLoading };
}
