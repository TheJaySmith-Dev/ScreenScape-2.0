import { MediaItem, Movie, TVShow } from '../types';
import { UserPreference } from '../contexts/AuthContext';

// Calculate similarity score between media items based on genres and other factors
export function calculateSimilarityScore(item1: MediaItem, item2: MediaItem): number {
  const genres1 = item1.genre_ids || [];
  const genres2 = item2.genre_ids || [];

  // Calculate genre overlap (Jaccard similarity)
  const intersection = genres1.filter(g => genres2.includes(g)).length;
  const union = new Set([...genres1, ...genres2]).size;
  const genreSimilarity = union > 0 ? intersection / union : 0;

  // Add other similarity factors here in the future (director, actors, etc.)
  return genreSimilarity;
}

// Calculate preference-based recommendation score
export function calculatePreferenceScore(
  item: MediaItem,
  userPreferences: UserPreference[],
  allRecommendations: MediaItem[]
): number {
  let score = 0;

  // Base score from TMDB popularity (normalized)
  const baseScore = (item.popularity || 0) / 100; // Normalize popularity
  score += baseScore * 0.3;

  // Boost based on similarity to liked items
  const likedItems = userPreferences
    .filter(p => p.preference === 'like')
    .map(p => {
      // Find the media item data from preferences (this would need to be enhanced)
      // For now, we'll work with genre similarity
      const likedGenres = item.genre_ids || [];
      return likedGenres.length > 0 ? item : null;
    })
    .filter(Boolean) as MediaItem[];

  if (likedItems.length > 0) {
    for (const likedItem of likedItems) {
      const similarity = calculateSimilarityScore(item, likedItem);
      score += similarity * 0.5; // Weight for similarity
    }
    score = score / likedItems.length; // Average similarity
  }

  // Penalize disliked genres
  const dislikedGenres = new Set(
    userPreferences
      .filter(p => p.preference === 'dislike')
      .flatMap(p => {
        // This would need actual disliked item data, simplified for now
        return [];
      })
  );

  const itemGenres = item.genre_ids || [];
  const dislikedGenreOverlap = itemGenres.filter(g => dislikedGenres.has(g)).length;
  if (dislikedGenreOverlap > 0) {
    score *= (1 - (dislikedGenreOverlap / itemGenres.length) * 0.3); // Reduce score for disliked genres
  }

  // Add some randomness to avoid always showing the same results
  score += Math.random() * 0.1;

  return Math.max(0, Math.min(100, score)); // Normalize to 0-100
}

// Generate personalized recommendations based on user preferences
export function generatePersonalizedRecommendations(
  baseRecommendations: MediaItem[],
  userPreferences: UserPreference[],
  limit: number = 20
): MediaItem[] {
  if (userPreferences.length === 0) {
    // Return base recommendations if no preferences
    return baseRecommendations.slice(0, limit);
  }

  // Calculate preference scores for all recommendations
  const scoredRecommendations = baseRecommendations.map(item => ({
    item,
    score: calculatePreferenceScore(item, userPreferences, baseRecommendations),
  }));

  // Sort by score (highest first) and return top recommendations
  scoredRecommendations.sort((a, b) => b.score - a.score);

  return scoredRecommendations.slice(0, limit).map(scored => scored.item);
}

// Get user preference statistics for analytics/reporting
export function getUserPreferenceStats(userPreferences: UserPreference[]) {
  const stats = {
    totalLikes: userPreferences.filter(p => p.preference === 'like').length,
    totalDislikes: userPreferences.filter(p => p.preference === 'dislike').length,
    moviePreferences: userPreferences.filter(p => p.media_type === 'movie'),
    tvPreferences: userPreferences.filter(p => p.media_type === 'tv'),
  };

  return stats;
}

// Simple collaborative filtering: find items liked by users with similar tastes
export function findSimilarUserRecommendations(
  userPreferences: UserPreference[],
  allUserPreferences: UserPreference[][],
  allMovies: MediaItem[]
): MediaItem[] {
  // This is a simplified implementation
  // In a real system, this would involve more complex collaborative filtering

  if (allUserPreferences.length === 0 || userPreferences.length === 0) {
    return [];
  }

  // Find users with similar preferences (simple similarity based on liked genres)
  const currentUserLikedGenres = new Set(
    userPreferences
      .filter(p => p.preference === 'like')
      .flatMap(() => []) // Would need genre data, simplified
  );

  const similarUsers = allUserPreferences.filter(otherUserPrefs => {
    if (otherUserPrefs === userPreferences) return false;

    const otherLikedGenres = new Set(
      otherUserPrefs
        .filter(p => p.preference === 'like')
        .flatMap(() => []) // Would need genre data, simplified
    );

    // Calculate overlap
    const intersection = [...currentUserLikedGenres].filter(g => otherLikedGenres.has(g)).length;
    const union = new Set([...currentUserLikedGenres, ...otherLikedGenres]).size;

    return union > 0 && (intersection / union) > 0.3; // 30% similarity threshold
  });

  // Get items liked by similar users but not by current user
  const currentUserLikes = new Set(userPreferences.map(p => p.media_id));
  const recommendedItemIds = new Set<number>();

  similarUsers.forEach(user => {
    user
      .filter(p => p.preference === 'like' && !currentUserLikes.has(p.media_id))
      .forEach(p => recommendedItemIds.add(p.media_id));
  });

  // Convert back to MediaItem objects (simplified - would need actual data)
  return allMovies.filter(movie => recommendedItemIds.has(movie.id)).slice(0, 10);
}
