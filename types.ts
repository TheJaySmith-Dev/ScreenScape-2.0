import { type } from "@google/genai";

export enum ViewType {
  NETFLIX = 'NETFLIX',
  TINDER = 'TINDER',
  TIKTOK = 'TIKTOK',
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface MovieDetails extends Movie {
    genres: { id: number, name: string }[];
    runtime: number;
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

// Auth & Account Types
export interface RequestTokenResponse {
    success: boolean;
    expires_at: string;
    request_token: string;
}

export interface SessionResponse {
    success: boolean;
    session_id: string;
}

export interface AccountDetails {
    avatar: {
        gravatar: {
            hash: string;
        };
        tmdb: {
            avatar_path: string | null;
        }
    };
    id: number;
    iso_639_1: string;
    iso_3166_1: string;
    name: string;
    include_adult: boolean;
    username: string;
}