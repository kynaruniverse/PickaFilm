import Constants from 'expo-constants';

const TMDB_API_KEY = Constants.expoConfig.extra.tmdbApiKey;
const BASE_URL = 'https://api.themoviedb.org/3';

export const searchMovies = async (query) => {
  try {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    return data.results ?? [];
  } catch (err) {
    console.error('searchMovies failed:', err);
    return [];
  }
};

export const getMovieDetails = async (tmdbId) => {
  try {
    const response = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('getMovieDetails failed:', err);
    return null;
  }
};

export const getPosterUrl = (posterPath, size = 'w500') =>
  posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : null;