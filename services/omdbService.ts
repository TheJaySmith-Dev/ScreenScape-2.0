const OMDb_API_URL = 'https://www.omdbapi.com/';

export interface OMDbMovieDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Response: string;
  Error?: string;
}

// Use a free OMDb API key - users need to sign up at https://www.omdbapi.com for their own key if they exceed the limits
const OMDb_API_KEY = '72c70bbe'; // This is a demo key with rate limits

export const searchOMDb = async (title: string, year?: string): Promise<OMDbMovieDetails | null> => {
  try {
    const url = new URL(OMDb_API_URL);
    url.searchParams.append('apikey', OMDb_API_KEY);
    url.searchParams.append('t', title);

    if (year) {
      url.searchParams.append('y', year);
    }

    url.searchParams.append('plot', 'full'); // Get full plot summary
    url.searchParams.append('r', 'json');

    const response = await fetch(url.toString());
    const data: OMDbMovieDetails = await response.json();

    if (data.Response === 'True') {
      return data;
    } else {
      console.warn('OMDb search failed:', data.Error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching from OMDb:', error);
    return null;
  }
};

export const getOMDbMovieDetails = async (imdbId: string): Promise<OMDbMovieDetails | null> => {
  try {
    const url = new URL(OMDb_API_URL);
    url.searchParams.append('apikey', OMDb_API_KEY);
    url.searchParams.append('i', imdbId);
    url.searchParams.append('plot', 'full');
    url.searchParams.append('r', 'json');

    const response = await fetch(url.toString());
    const data: OMDbMovieDetails = await response.json();

    if (data.Response === 'True') {
      return data;
    } else {
      console.warn('OMDb details fetch failed:', data.Error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching OMDb details:', error);
    return null;
  }
};

// Helper function to get OMDb data from TMDB movie details
export const getOMDbFromTMDBDetails = async (tmdbDetails: any): Promise<OMDbMovieDetails | null> => {
  // Try to use IMDB ID from TMDB data first
  if (tmdbDetails.imdb_id) {
    return await getOMDbMovieDetails(tmdbDetails.imdb_id);
  }

  // Fallback to title search
  const title = tmdbDetails.title || tmdbDetails.name;
  const year = tmdbDetails.release_date
    ? new Date(tmdbDetails.release_date).getFullYear().toString()
    : undefined;

  return await searchOMDb(title, year);
};
