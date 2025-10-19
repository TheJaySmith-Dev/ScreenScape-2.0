/**
 * Fetches the current live video ID for a given YouTube channel.
 * Returns the video ID if the channel is currently live, otherwise null.
 * @param channelId The YouTube channel ID
 * @returns Promise<string | null>
 */
// For now, return null to avoid loading issues without API key
// This allows the app to work with static "no live stream" state
export const getLiveVideoId = async (channelId: string): Promise<string | null> => {
  return null; // Return null until proper API key is configured
};

// This module handles the asynchronous loading of the YouTube IFrame Player API.
// It should be imported once at the root of the application (e.g., in index.tsx)
// to set up the global callback before the YouTube script executes.

let resolveApiReady: (() => void) | null = null;

// This promise will be resolved when the YouTube API is ready.
const apiReadyPromise = new Promise<void>((resolve) => {
  resolveApiReady = resolve;
});

// The YouTube API script will call this global function when it's ready.
// We define it here to capture the moment the API becomes available.
(window as any).onYouTubeIframeAPIReady = () => {
  if (resolveApiReady) {
    resolveApiReady();
  }
};

/**
 * Returns a promise that resolves when the YouTube IFrame API is ready.
 * Call this function in any component that needs to interact with the YouTube Player API
 * before attempting to create a new YT.Player instance.
 *
 * @example
 * ensureYouTubeApiIsReady().then(() => {
 *   new window.YT.Player(...);
 * });
 */
export const ensureYouTubeApiIsReady = (): Promise<void> => {
  // If the API is already available (e.g., the script finished loading before this was called),
  // we can resolve immediately.
  if ((window as any).YT && (window as any).YT.Player) {
    return Promise.resolve();
  }
  // Otherwise, we return the promise that is waiting for the onYouTubeIframeAPIReady callback.
  return apiReadyPromise;
};
