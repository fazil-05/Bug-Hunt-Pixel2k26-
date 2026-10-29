// In-memory cache for Vercel edge/serverless function
let cachedState = {
  round: {
    id: 'round-1',
    title: 'Bug Hunt Pixel2k26: Championship Round',
    instructions: 'Identify all five hidden intentional bugs in the ShopEasy e-commerce website before the timer runs out.',
    status: 'draft',
    durationSeconds: 600,
    startedAt: null,
    pausedAt: null,
    accumulatedPausedDurationMs: 0,
    challengeId: 'shopeasy-v1',
    challengeName: 'ShopEasy e-Commerce Store',
    totalBugs: 5,
    showLeaderboardToTeams: true,
    soundEnabled: true,
  },
  teams: null,
  timestamp: Date.now()
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (body && body.round) {
        cachedState = {
          round: body.round,
          teams: body.teams || cachedState.teams,
          timestamp: Date.now()
        };
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json({ success: true, state: cachedState });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // GET: Return current live state
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).json(cachedState);
}
