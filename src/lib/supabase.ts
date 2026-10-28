import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseUrl.includes('example.com')
);

// Fallback dummy client if credentials are not filled yet
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Cross-window and cross-tab broadcast bus
 * Enables real-time synchronization between Admin and Participant tabs/devices.
 */
class ArenaBroadcastBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(event: { type: string; payload: unknown }) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('bug_hunt_arena_realtime_channel');
        this.channel.onmessage = (e) => {
          this.notifyListeners(e.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }
    }

    // Also listen to storage events as secondary cross-window bridge
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'bug_hunt_arena_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  public emit(type: string, payload: unknown) {
    const message = { type, payload, timestamp: Date.now() };

    // Broadcast channel
    if (this.channel) {
      this.channel.postMessage(message);
    }

    // Local storage event for cross-browser / cross-tab fallback
    try {
      localStorage.setItem('bug_hunt_arena_sync_event', JSON.stringify(message));
    } catch {
      // ignore
    }

    // Also notify listeners in current window
    this.notifyListeners(message);
  }

  public subscribe(callback: (event: { type: string; payload: unknown }) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(event: { type: string; payload: unknown }) {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('Broadcast listener error:', err);
      }
    });
  }
}

export const arenaBus = new ArenaBroadcastBus();

