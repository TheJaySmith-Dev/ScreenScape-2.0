export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  media_type: 'movie';
  genre_ids: number[];
  popularity: number;
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  media_type: 'tv';
  genre_ids: number[];
  popularity: number;
  // Fix: Add optional properties for normalization to create a consistent MediaItem shape
  title?: string;
  release_date?: string;
}

export interface Person {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
}

export type MediaItem = Movie | TVShow;

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Video {
    iso_639_1: string;
    iso_3166_1: string;
    name: string;
    key: string;
    site: 'YouTube';
    size: number;
    type: 'Trailer' | 'Teaser' | 'Clip' | 'Behind the Scenes' | 'Featurette';
    official: boolean;
    published_at: string;
    id: string;
}

export interface Genre {
    id: number;
    name: string;
}

interface ProductionCompany {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
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
    profile_path: string | null;
}

export interface CreditsResponse {
    id: number;
    cast: CastMember[];
    crew: CrewMember[];
}

// Fix: Add PersonMovieCredit and PersonCreditsResponse for SixDegreesGame
export interface PersonMovieCredit extends Movie {
    character: string;
}

export interface PersonCreditsResponse {
    id: number;
    cast: PersonMovieCredit[];
    crew: CrewMember[];
}

// Fix: Add Image and ImagesResponse for GuessThePosterGame
export interface Image {
    aspect_ratio: number;
    height: number;
    iso_639_1: string | null;
    file_path: string;
    vote_average: number;
    vote_count: number;
    width: number;
}

export interface ImagesResponse {
    id: number;
    backdrops: Image[];
    logos: Image[];
    posters: Image[];
}

export interface WatchProvider {
    logo_path: string;
    provider_id: number;
    provider_name: string;
    display_priority: number;
}

export interface WatchProviderCountry {
    link: string;
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
}

export interface WatchProviderResponse {
    id: number;
    results: {
        [countryCode: string]: WatchProviderCountry;
    };
}

export interface MovieDetails extends Movie {
    genres: Genre[];
    runtime: number | null;
    production_companies: ProductionCompany[];
    videos: { results: Video[] };
    credits: { cast: CastMember[]; crew: CrewMember[] };
    'watch/providers': WatchProviderResponse;
}

export interface TVShowDetails extends TVShow {
    genres: Genre[];
    number_of_seasons: number;
    number_of_episodes: number;
    episode_run_time: number[];
    production_companies: ProductionCompany[];
    videos: { results: Video[] };
    credits: { cast: CastMember[]; crew: CrewMember[] };
    'watch/providers': WatchProviderResponse;
}
