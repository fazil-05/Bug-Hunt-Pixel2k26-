import { CompetitionRound, Team } from '../types';

export interface CloudStatePayload {
  round: CompetitionRound;
  teams?: Team[];
  timestamp: number;
}

const KVDB_ENDPOINT = 'https://kvdb.io/6fT5rK9mQ2s8wX1/pixel2k26_state';
const VERCEL_API_ENDPOINT = '/api/state';

class CloudSyncService {
  private lastFetchedTimestamp = 0;

  /**
   * Pushes the latest round and teams state to both the Vercel API and KVDB
   */
  public async pushState(round: CompetitionRound, teams?: Team[]): Promise<void> {
    const payload: CloudStatePayload = {
      round,
      teams,
      timestamp: Date.now()
    };
    const bodyStr = JSON.stringify(payload);

    // 1. Post to Vercel same-domain serverless function
    try {
      fetch(VERCEL_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      }).catch(() => {});
    } catch {}

    // 2. Post to global cloud KVDB fallback
    try {
      fetch(KVDB_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      }).catch(() => {});
    } catch {}
  }

  /**
   * Fetches latest match state from cloud.
   * Tries Vercel API first; falls back to KVDB.
   */
  public async fetchState(): Promise<CloudStatePayload | null> {
    // 1. Try Vercel API endpoint
    try {
      const res = await fetch(`${VERCEL_API_ENDPOINT}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.round && data.round.status) {
          if (data.timestamp && data.timestamp >= this.lastFetchedTimestamp) {
            this.lastFetchedTimestamp = data.timestamp;
            return data as CloudStatePayload;
          }
        }
      }
    } catch {
      // Vercel API error or running locally
    }

    // 2. Try KVDB global cloud store fallback
    try {
      const kvRes = await fetch(`${KVDB_ENDPOINT}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (kvRes.ok) {
        const kvData = await kvRes.json();
        if (kvData && kvData.round && kvData.round.status) {
          if (kvData.timestamp && kvData.timestamp >= this.lastFetchedTimestamp) {
            this.lastFetchedTimestamp = kvData.timestamp;
            return kvData as CloudStatePayload;
          }
        }
      }
    } catch {
      // ignore
    }

    return null;
  }
}

export const cloudSync = new CloudSyncService();
