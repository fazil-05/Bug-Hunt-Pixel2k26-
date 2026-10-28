# Bug Hunt Pixel2k26 🏆

**Bug Hunt Pixel2k26** is a production-grade, real-time bug hunting competition platform where four teams compete to identify five intentionally engineered defects in an interactive e-commerce website within a synchronized, authoritative countdown timer.

---

## 🌟 Key Features

### 1. Two Dedicated Interfaces
- **Organizer Admin Dashboard (`/admin`)**:
  - Live synchronized master countdown timer with start, pause, resume, end, and reset controls.
  - Real-time team connection status (Online/Offline) and heartbeat tracking.
  - Live scoreboard ranked by:
    1. Highest number of correctly identified bugs (+20 pts each, max 100)
    2. Fastest time to reach that score
    3. Fewest incorrect submissions
  - Team progress cards for **Team Alpha**, **Team Beta**, **Team Gamma**, and **Team Delta** with individual 5-bug visual slots.
  - Live incoming bug submissions stream with administrator manual review and point override capabilities.
  - Confidential challenge diagnostic answer key with exact reproduction steps, expected vs. actual behavior, and code explanations.
  - Broadcast leaderboard toggle (show or hide live leaderboard from participants during competition).
  - Export final tournament standings to CSV.
  - Results publication with winner fanfare and celebratory confetti.

- **Participant Competition Platform (`/play/:teamCode`)**:
  - Live synchronized authoritative countdown timer (with 60-second warning alert and 30-second critical pulsating red alarm).
  - Web Audio synthesized audio alerts (warning pings, success chimes, submission rejection sounds, time's up siren, winner fanfare).
  - Real-time bug progress tracker showing undiscovered vs. identified bugs.
  - Dual bug reporting system:
    - **Method 1: Click to Report** — Structured form with section selection, defect description, and reproduction steps.
    - **Method 2: Inspect Element Mode** — Interactive crosshair mode with element highlight overlays and click-to-prefill bug reports.
  - Real-time feedback without leaking answers:
    - Accepted: *"Bug identified successfully! +20 points."*
    - Rejected: *"Report submitted, but no matching bug was confirmed."*
  - Submission history drawer with accepted and rejected logs.
  - Post-round completion screen revealing final rankings, winner podium, and detailed diagnostic explanations of all five bugs once published by the organizer.

---

## 🛒 The Challenge Website: "ShopEasy"

An interactive, modern e-commerce web application with **five actual, reproducible in-code bugs**:

| Bug # | Defect Title | Category | Target Selector | Actual Broken Behavior |
|---|---|---|---|---|
| **Bug 1** | Search Functionality Inversion | `search` | `#shop-search-input` | Typing valid keywords (e.g., "AirPro", "Watch", "Keyboard") returns an empty product list and "No products found". |
| **Bug 2** | Add to Cart State Mutation Failure | `cart` | `.btn-add-to-cart[data-product-id="1"]` | Clicking "Add to Cart" on the featured product (AirPro ANC Headphones) fails to update the shopping cart or badge. |
| **Bug 3** | Cart Price Calculation Arithmetic Error | `pricing` | `#cart-total-price` | Shopping cart calculates an incorrect total price by subtracting shipping cost instead of adding it: `Total = (Subtotal - Shipping) + Tax`. |
| **Bug 4** | Navigation Category Route Mismatch | `navigation` | `nav a[data-nav="audio"]` | Clicking the "Audio" category link in the navigation bar navigates to a 404 Route Not Found error screen instead of filtering audio items. |
| **Bug 5** | Checkout Form Email Validation Bypass | `form_validation` | `#checkout-email-input` | Checkout form accepts invalid email addresses (e.g. `team@`, `invalid-email`) and completes orders without validation errors. |

---

## 🛠 Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React Icons, Framer Motion, Canvas Confetti.
- **Audio Engine**: Pure Web Audio API synthesis (zero external audio file dependencies).
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS), Supabase Realtime.
- **Validation Engine**: Supabase Edge Functions with rate limiting and server-side RPC scoring logic.
- **Hybrid Realtime Bus**: Works with direct Supabase Realtime channels **or** built-in cross-tab/window BroadcastChannel fallback, ensuring the platform works immediately out-of-the-box without requiring initial cloud setup.

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Quick Start
```bash
# 1. Clone repository and navigate to folder
cd shifaz

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The application will be accessible at:
- **Landing Page**: `http://localhost:3000/`
- **Team Join Page**: `http://localhost:3000/join`
- **Admin Command Center**: `http://localhost:3000/admin` *(Passcode: `admin123`)*
- **Team Alpha**: `http://localhost:3000/play/alpha`
- **Team Beta**: `http://localhost:3000/play/beta`
- **Team Gamma**: `http://localhost:3000/play/gamma`
- **Team Delta**: `http://localhost:3000/play/delta`

### Production Build
```bash
npm run build
npm run preview
```

---

## 🧑‍💼 How to Run a Live Competition (Organizer Guide)

1. Open `http://localhost:3000/admin` in your browser.
2. Enter the organizer passcode: **`admin123`**.
3. Share the four team links with participants or project the `/join` page on a main screen:
   - Team Alpha: `/play/alpha`
   - Team Beta: `/play/beta`
   - Team Gamma: `/play/gamma`
   - Team Delta: `/play/delta`
4. Verify each team is marked **"Online"** in the Admin Team Cards.
5. In the top bar, click **"Start Round"** (default is 10 minutes, or click "Configure Round" to choose 5m, 15m, or custom duration).
6. Watch the live synchronized timer count down simultaneously across all participant screens.
7. Monitor incoming reports in the **Live Bug Submissions Feed**. If a description is borderline or ambiguous, use the **"Accept & Award +20 pts"** or **"Revoke Points"** buttons.
8. When time expires (or when you click **"End Round"**), participant submissions are automatically locked.
9. Click **"Publish Results"** to announce the winner, show final standings, and reveal the diagnostic breakdown of all five bugs!
10. Click **"Export CSV"** to save the tournament scores.

---

## 🔒 Security & Anti-Cheat Architecture

- **Backend-Guarded Answer Key**: Bug solutions and grading logic are never stored in client JavaScript, HTML, or publicly accessible queries.
- **Row Level Security (RLS)**: Enforces that `challenge_bugs` answer tables cannot be read by participants until results are published.
- **Server-Side Validation**: Bug submissions are validated through the PostgreSQL stored procedure `submit_bug_report()` or Edge Function `grade-submission`.
- **Anti-Duplication**: Teams cannot be awarded points twice for the same bug.
- **Rate Limiting**: Teams are restricted to 1 submission every 2 seconds to prevent automated brute-force scripts.
- **Timer Tamper Prevention**: Time is calculated from the authoritative server start timestamp and accumulated paused offset, not the participant's system clock.

---

## ☁️ Deployment Instructions

### Deploying to Supabase
1. Create a new project in [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the complete SQL migration file:
   `supabase/migrations/20261028_initial_schema.sql`
4. Deploy the Edge Function:
   ```bash
   supabase functions deploy grade-submission --no-verify-jwt
   ```
5. Copy your **Project URL** and **Anon Public Key** from *Settings > API*.

### Deploying to Vercel
1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Add the environment variables:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-public-key`
4. Click **Deploy**.

