import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://uifqjmyryzyfmitbvlkl.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZnFqbXlyeXp5Zm1pdGJ2bGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNjIyMjMsImV4cCI6MjEwODczODIyM30._qmoCxCWkVXKl4_DETndO6DDZLaysSi1EP5y2NeND9U';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseUrl.includes('example.com')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    })
  : null;

export interface ArenaBusEvent {
  type: string;
  payload: unknown;
  senderId?: string;
  timestamp?: number;
}

/**
 * Robust Cross-Network, Cross-Device & Cross-Browser Realtime Bus
 * Connects Admin and Students worldwide over Supabase WebSockets + Presence.
 * Uses Supabase Server Presence so late-joining students in any browser
 * immediately get the running match from the cloud without relying on client-to-client hops.
 */
class ArenaBroadcastBus {
  private localChannel: BroadcastChannel | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private listeners: Array<(event: ArenaBusEvent) => void> = [];
  private clientId: string = Math.random().toString(36).substring(2, 11);
  private isSubscribed: boolean = false;
  private pendingQueue: Array<{ type: string; payload: unknown }> = [];
  private currentTrackedState: Record<string, unknown> | null = null;

  constructor() {
    // 1. Local Browser BroadcastChannel (for same browser tabs)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localChannel = new BroadcastChannel('bug_hunt_arena_realtime_channel');
        this.localChannel.onmessage = (e) => {
          if (e.data && e.data.senderId !== this.clientId) {
            this.notifyListeners(e.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }
    }

    // 2. Storage event listener (secondary local fallback)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'bug_hunt_arena_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data.senderId !== this.clientId) {
              this.notifyListeners(data);
            }
          } catch {
            // ignore
          }
        }
      });
    }

    // 3. Supabase Realtime Channel with Presence & Broadcast
    if (supabase) {
      try {
        this.supabaseChannel = supabase.channel('bug_hunt_pixel2k26_arena', {
          config: {
            broadcast: { self: false },
            presence: { key: this.clientId }
          }
        });

        // Broadcast listener for instant events
        this.supabaseChannel.on('broadcast', { event: 'arena-message' }, ({ payload }) => {
          if (payload && payload.senderId !== this.clientId) {
            this.notifyListeners(payload as ArenaBusEvent);
          }
        });

        // Presence sync listener: server cluster immediately sends state to new subscribers
        this.supabaseChannel.on('presence', { event: 'sync' }, () => {
          const state = this.supabaseChannel?.presenceState();
          if (state) {
            this.notifyListeners({
              type: 'PRESENCE_SYNC',
              payload: state,
              senderId: 'supabase-presence-server'
            });
          }
        });

        this.supabaseChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            // If we have state to track, track it on the server
            if (this.currentTrackedState) {
              this.supabaseChannel?.track(this.currentTrackedState).catch(() => {});
            }
            // Flush any pending events queued while connecting
            while (this.pendingQueue.length > 0) {
              const item = this.pendingQueue.shift();
              if (item) this.emit(item.type, item.payload);
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isSubscribed = false;
          }
        });
      } catch (err) {
        console.warn('Supabase Realtime setup error:', err);
      }
    }
  }

  /**
   * Tracks authoritative state into the Supabase server cluster memory.
   * Any student connecting now or later receives this state automatically from Supabase.
   */
  public trackPresence(state: Record<string, unknown>) {
    this.currentTrackedState = state;
    if (this.supabaseChannel && this.isSubscribed) {
      this.supabaseChannel.track(state).catch(err => {
        console.warn('Presence track error:', err);
      });
    }
  }

  public getPresenceState(): Record<string, unknown[]> | null {
    if (this.supabaseChannel) {
      return this.supabaseChannel.presenceState() as Record<string, unknown[]>;
    }
    return null;
  }

  public emit(type: string, payload: unknown) {
    const message: ArenaBusEvent = { 
      type, 
      payload, 
      senderId: this.clientId, 
      timestamp: Date.now() 
    };

    // 1. Broadcast over Supabase Realtime across internet to all devices/browsers
    if (this.supabaseChannel && this.isSubscribed) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'arena-message',
        payload: message
      }).catch(err => {
        console.warn('Supabase Realtime broadcast error:', err);
      });
    } else if (this.supabaseChannel && !this.isSubscribed) {
      this.pendingQueue.push({ type, payload });
    }

    // 2. Local BroadcastChannel
    if (this.localChannel) {
      try {
        this.localChannel.postMessage(message);
      } catch {}
    }

    // 3. Local storage event
    try {
      localStorage.setItem('bug_hunt_arena_sync_event', JSON.stringify(message));
    } catch {}

    // 4. Local listeners in current window
    this.notifyListeners(message);
  }

  public subscribe(callback: (event: ArenaBusEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(event: ArenaBusEvent) {
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

/**
 * Extracts latest round & teams from Supabase Server Presence state dictionary
 */
export function extractPresenceData(presenceState: Record<string, unknown[]> | null) {
  if (!presenceState) return null;
  let latestTimestamp = 0;
  let result: { round?: any; teams?: any } | null = null;

  for (const key of Object.keys(presenceState)) {
    const items = presenceState[key];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && typeof item === 'object') {
          const rec = item as Record<string, any>;
          if (rec.round && rec.round.status) {
            const ts = rec.timestamp || (rec.round.startedAt || 1);
            if (ts >= latestTimestamp) {
              latestTimestamp = ts;
              result = { round: rec.round, teams: rec.teams };
            }
          }
        }
      }
    }
  }

  return result;
}
