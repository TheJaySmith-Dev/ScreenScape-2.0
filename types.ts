// Raw API response type for a movie
export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  popularity: number;
  media_type?: 'movie';
}

// Raw API response type for a TV show
export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  popularity: number;
  media_type?: 'tv';
}

// Normalized type for use throughout the UI components
export interface MediaItem {
  id: number;
  title: string; // Normalized from movie.title or tv.name
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string; // Normalized from movie.release_date or tv.first_air_date
  vote_average: number;
  genre_ids: number[];
  popularity: number;
  media_type: 'movie' | 'tv';
}

export interface MovieDetails extends Movie {
    genres: { id: number, name: string }[];
    runtime: number;
}

export interface NextEpisodeToAir {
    id: number;
    name: string;
    overview: string;
    vote_average: number;
    vote_count: number;
    air_date: string;
    episode_number: number;
    production_code: string;
    runtime: number;
    season_number: number;
    show_id: number;
    still_path: string | null;
}

export interface Creator {
    id: number;
    credit_id: string;
    name: string;
    gender: number | null;
    profile_path: string | null;
}

export interface SeasonSummary {
    air_date: string | null;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
}

export interface TVShowDetails extends TVShow {
    genres: { id: number, name: string }[];
    created_by: Creator[];
    episode_run_time: number[];
    number_of_seasons: number;
    seasons: SeasonSummary[];
    next_episode_to_air: NextEpisodeToAir | null;
    last_air_date: string | null;
    status: string;
}

export interface Episode {
    air_date: string;
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    season_number: number;
    still_path: string | null;
}


export interface Video {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  official: boolean;
  published_at: string;
  site: string;
  size: number;
  type: string;
}

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

export interface CrewMember {
    id: number;
    name: string;
    job: string;
}

export interface CreditsResponse {
    cast: CastMember[];
    crew: CrewMember[];
}

export interface LogoImage {
    aspect_ratio: number;
    file_path: string;
    height: number;
    iso_639_1: string;
    vote_average: number;
    vote_count: number;
    width: number;
}

export interface ImageResponse {
    id: number;
    logos: LogoImage[];
}

export interface Provider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviderCountry {
  link: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

export interface WatchProviderResponse {
  id: number;
  results: {
    [countryCode: string]: WatchProviderCountry;
  };
}

export type FilterCategory = 'service' | 'studio' | 'network';

export interface ActiveFilter {
  type: FilterCategory;
  id: number;
  name: string;
}
