/**
 * Test script for the robust trailer retrieval system
 * Tests OMDb and KinoCheck APIs with fallback logic
 */

import { trailerManager } from './services/trailerManager.js';
import { MediaItem } from './types.js';

// Test data - popular movies with known trailers
const testMovies: MediaItem[] = [
  {
    id: 550, // Fight Club
    title: 'Fight Club',
    release_date: '1999-10-15',
    media_type: 'movie',
    poster_path: '/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg',
    backdrop_path: '/87hTDiay2N2qWyX4Ds7ybXi9h8I.jpg',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
    vote_average: 8.4,
    vote_count: 26280,
    adult: false,
    genre_ids: [18, 53],
    original_language: 'en',
    original_title: 'Fight Club',
    popularity: 61.416,
    video: false
  },
  {
    id: 13, // Forrest Gump
    title: 'Forrest Gump', 
    release_date: '1994-07-06',
    media_type: 'movie',
    poster_path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
    backdrop_path: '/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg',
    overview: 'A man with a low IQ has accomplished great things in his life and been present during significant historic events.',
    vote_average: 8.5,
    vote_count: 24000,
    adult: false,
    genre_ids: [35, 18, 10749],
    original_language: 'en',
    original_title: 'Forrest Gump',
    popularity: 48.307,
    video: false
  },
  {
    id: 680, // Pulp Fiction
    title: 'Pulp Fiction',
    release_date: '1994-10-14',
    media_type: 'movie',
    poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdrop_path: '/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg',
    overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in this sprawling, comedic crime caper.',
    vote_average: 8.5,
    vote_count: 25000,
    adult: false,
    genre_ids: [80, 18],
    original_language: 'en',
    original_title: 'Pulp Fiction',
    popularity: 65.107,
    video: false
  }
];

async function testTrailerRetrieval() {
  console.log('🎬 Testing Robust Trailer Retrieval System\n');
  console.log('=' .repeat(60));

  for (const movie of testMovies) {
    console.log(`\n🎭 Testing: ${movie.title} (${movie.release_date?.split('-')[0]})`);
    console.log('-'.repeat(40));

    try {
      const startTime = Date.now();
      const result = await trailerManager.getTrailerUrl(movie);
      const duration = Date.now() - startTime;

      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`✅ Success: ${result.success}`);
      console.log(`🎯 Source: ${result.source}`);
      console.log(`📺 Trailer URL: ${result.trailerUrl ? 'Found' : 'Not found'}`);
      console.log(`💾 Cached: ${result.cached ? 'Yes' : 'No'}`);
      
      if (result.trailerUrl) {
        console.log(`🔗 URL Preview: ${result.trailerUrl.substring(0, 80)}...`);
      }
      
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      }

      // Test caching - second request should be faster
      if (result.success) {
        console.log('\n🔄 Testing cache...');
        const cacheStartTime = Date.now();
        const cachedResult = await trailerManager.getTrailerUrl(movie);
        const cacheDuration = Date.now() - cacheStartTime;
        
        console.log(`⚡ Cache hit duration: ${cacheDuration}ms`);
        console.log(`💾 From cache: ${cachedResult.cached ? 'Yes' : 'No'}`);
      }

    } catch (error) {
      console.log(`💥 Unexpected error: ${error.message}`);
    }
  }

  // Test preloading
  console.log('\n\n🚀 Testing Preloading');
  console.log('=' .repeat(60));
  
  try {
    const preloadResults = await trailerManager.preloadTrailers(testMovies.slice(0, 3));
    console.log(`📦 Preloaded ${preloadResults.successful} out of ${preloadResults.total} trailers`);
    console.log(`❌ Failed: ${preloadResults.failed}`);
  } catch (error) {
    console.log(`💥 Preload error: ${error.message}`);
  }

  // Test cache stats
  console.log('\n\n📊 Cache Statistics');
  console.log('=' .repeat(60));
  const stats = trailerManager.getCacheStats();
  console.log(`📈 Cache size: ${stats.size} entries`);
  console.log(`🎯 Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);

  console.log('\n✨ Testing completed!');
}

// Error scenario testing
async function testErrorScenarios() {
  console.log('\n\n🚨 Testing Error Scenarios');
  console.log('=' .repeat(60));

  // Test with invalid movie data
  const invalidMovies = [
    null,
    undefined,
    {},
    { id: 'invalid' },
    { title: '' },
    { id: -1, title: 'Invalid ID Movie', media_type: 'movie' }
  ];

  for (let i = 0; i < invalidMovies.length; i++) {
    console.log(`\n🔍 Test ${i + 1}: ${JSON.stringify(invalidMovies[i])}`);
    try {
      const result = await trailerManager.getTrailerUrl(invalidMovies[i]);
      console.log(`✅ Handled gracefully: ${result.success ? 'Success' : 'Failed as expected'}`);
      if (result.error) {
        console.log(`📝 Error message: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Unhandled error: ${error.message}`);
    }
  }
}

// Run tests
async function runAllTests() {
  try {
    await testTrailerRetrieval();
    await testErrorScenarios();
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { testTrailerRetrieval, testErrorScenarios, runAllTests };