
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


export interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  watchProviders?: WatchProviderCountry | null;
}

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
    site: string;
    size: number;
    type: string;
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

export interface MovieDetails extends Movie {
    genres: Genre[];
    runtime: number | null;
    production_companies: ProductionCompany[];
}

export interface TVShowDetails extends TVShow {
    genres: Genre[];
    number_of_seasons: number;
    number_of_episodes: number;
    episode_run_time: number[];
    production_companies: ProductionCompany[];
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
    backdrops: any[];
    logos: LogoImage[];
    posters: any[];
}

export interface Episode {
    air_date: string;
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    production_code: string;
    season_number: number;
    still_path: string | null;
    vote_average: number;
    vote_count: number;
}

export type FilterCategory = 'service' | 'studio' | 'network';

export interface ActiveFilter {
  type: FilterCategory;
  id: number;
  name: string;
}
