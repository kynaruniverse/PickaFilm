import Constants from 'expo-constants';

const TMDB_API_KEY = Constants.expoConfig.extra.tmdbApiKey;
const BASE_URL = 'https://api.themoviedb.org/3';

export const searchMovies = async (query) => {
  const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.results;
};

export const getMovieDetails = async (tmdbId) => {
  const response = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
  return await response.json();
};