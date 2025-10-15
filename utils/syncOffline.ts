import { supabase } from './supabase';

// Offline queue for actions when not connected
interface OfflineQueueItem {
  id: string;
  type: 'add_watchlist' | 'remove_watchlist' | 'search_history' | 'game_progress' | 'user_settings';
  data: any;
  timestamp: number;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'screenscape_offline_queue';
const MAX_RETRY_COUNT = 3;

class SyncManager {
  private onlineStatus: boolean = navigator.onLine;
  private offlineQueue: OfflineQueueItem[] = [];

  constructor() {
    this.loadOfflineQueue();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    this.onlineStatus = true;
    console.log('Back online, processing offline queue...');
    this.processOfflineQueue();
  }

  private handleOffline() {
    this.onlineStatus = false;
    console.log('Offline mode activated');
  }

  private loadOfflineQueue() {
    try {
      const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queue) {
        this.offlineQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private saveOfflineQueue() {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  public isOnline(): boolean {
    return this.onlineStatus;
  }

  public addToOfflineQueue(type: OfflineQueueItem['type'], data: any): string {
    const item: OfflineQueueItem = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.offlineQueue.push(item);
    this.saveOfflineQueue();

    if (this.onlineStatus) {
      this.processOfflineQueue();
    }

    return item.id;
  }

  private async processOfflineQueue() {
    if (!this.onlineStatus) return;

    const unprocessedItems = this.offlineQueue.filter(item => item.retryCount < MAX_RETRY_COUNT);

    for (const item of unprocessedItems) {
      try {
        await this.processQueueItem(item);
        this.removeFromQueue(item.id);
      } catch (error) {
        console.error(`Failed to process offline item ${item.id}:`, error);
        item.retryCount++;
        if (item.retryCount >= MAX_RETRY_COUNT) {
          console.warn(`Max retries reached for item ${item.id}, removing from queue`);
          this.removeFromQueue(item.id);
        } else {
          this.saveOfflineQueue();
        }
      }
    }
  }

  private async processQueueItem(item: OfflineQueueItem) {
    const { supabase } = await import('./supabase');

    switch (item.type) {
      case 'add_watchlist':
        await supabase
          .from('user_watchlist')
          .upsert({
            user_id: item.data.user_id,
            media_id: item.data.media_id,
            media_type: item.data.media_type,
            media_data: item.data.media_data,
            updated_at: new Date().toISOString(),
          });
        break;

      case 'remove_watchlist':
        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', item.data.user_id)
          .eq('media_id', item.data.media_id)
          .eq('media_type', item.data.media_type);
        break;

      case 'search_history':
        await supabase
          .from('user_search_history')
          .insert({
            user_id: item.data.user_id,
            query: item.data.query,
          });
        break;

      case 'game_progress':
        await supabase
          .from('user_game_progress')
          .upsert({
            user_id: item.data.user_id,
            game_type: item.data.game_type,
            game_data: item.data.progress,
            last_updated: new Date().toISOString(),
          });
        break;

      case 'user_settings':
        await supabase
          .from('user_settings')
          .upsert({
            id: item.data.user_id,
            ...item.data.settings,
            updated_at: new Date().toISOString(),
          });
        break;

      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  private removeFromQueue(itemId: string) {
    this.offlineQueue = this.offlineQueue.filter(item => item.id !== itemId);
    this.saveOfflineQueue();
  }

  public getQueueStatus() {
    return {
      isOnline: this.onlineStatus,
      queueLength: this.offlineQueue.length,
      pendingItems: this.offlineQueue.map(item => ({
        id: item.id,
        type: item.type,
        retryCount: item.retryCount,
        timestamp: item.timestamp,
      })),
    };
  }

  public clearOldItems(maxAgeHours: number = 24) {
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAgeMs;

    const originalLength = this.offlineQueue.length;
    this.offlineQueue = this.offlineQueue.filter(item => item.timestamp > cutoffTime);

    if (this.offlineQueue.length !== originalLength) {
      this.saveOfflineQueue();
    }
  }
}

// Create singleton instance
const syncManager = new SyncManager();

// Cleanup old items daily
setInterval(() => {
  syncManager.clearOldItems(24);
}, 24 * 60 * 60 * 1000);

export { syncManager };
export default syncManager;
