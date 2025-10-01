# QB Blind Resume - Project Context

## Project Overview
A web application that allows users to compare NFL quarterback seasons in a blind, side-by-side format without knowing player identities. Users vote on which season is better, and an ELO rating system ranks all QB seasons based on crowd-sourced preferences.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (hosted on Neon)
- **Deployment**: Vercel
- **Data Source**: NFLverse (nflreadr library/CSV endpoints)

## Key Features
1. **Blind Matchups**: Display two QB seasons side-by-side with stats but no player names
2. **User Voting**: Users pick which season they think is better
3. **Reveal Animation**: After voting, reveal player identities with smooth transition
4. **ELO Rating System**: Chess-style ELO (K-factor: 32) updates after each vote
5. **Global Rankings**: Standings page showing all QB seasons ranked by ELO
6. **Session Tracking**: Prevent repeated matchups using cookies/localStorage

## Data Requirements

### QB Season Filters
- Minimum 8 games played
- Minimum 200 pass attempts
- Regular season stats only

### Required Stats to Display
- Passing yards
- Pass attempts
- Completions
- Completion percentage
- Touchdowns
- Interceptions
- Passer rating
- Win/Loss record
- Year
- Team

### NFLverse Data Source
- Primary library: `nflreadr` (R package) or direct CSV/parquet access
- Function: `load_player_stats()` for QB season statistics
- Alternative: Direct URLs to nflverse-data GitHub repository
- Data dictionary: `dictionary_player_stats` for column references

## Database Schema (Planned)

### Tables
1. **qb_seasons**
   - id (PK)
   - player_name
   - year
   - team
   - games_played
   - pass_attempts
   - completions
   - passing_yards
   - touchdowns
   - interceptions
   - passer_rating
   - wins
   - losses
   - created_at

2. **elo_ratings**
   - id (PK)
   - season_id (FK → qb_seasons)
   - elo_score (default: seeded by passer rating heuristic)
   - vote_count
   - last_updated

3. **user_sessions**
   - id (PK)
   - session_id (unique)
   - created_at

4. **votes**
   - id (PK)
   - session_id (FK → user_sessions)
   - winner_season_id (FK → qb_seasons)
   - loser_season_id (FK → qb_seasons)
   - timestamp

5. **matchup_history**
   - id (PK)
   - session_id (FK → user_sessions)
   - season_a_id (FK → qb_seasons)
   - season_b_id (FK → qb_seasons)
   - shown_at

## API Routes (Planned)

### GET /api/matchup
- Query params: `session_id`
- Returns: Two random QB seasons, avoiding recent repeats for the session
- Response format:
```json
{
  "seasonA": { "id": 1, "stats": {...}, "year": 2020, "team": "..." },
  "seasonB": { "id": 2, "stats": {...}, "year": 2018, "team": "..." }
}
```

### POST /api/vote
- Body: `{ session_id, winner_id, loser_id }`
- Updates ELO ratings for both seasons
- Records vote in database
- Returns: Updated ELO scores and revealed player names
- Response format:
```json
{
  "winner": { "id": 1, "name": "...", "newElo": 1650 },
  "loser": { "id": 2, "name": "...", "newElo": 1550 }
}
```

### GET /api/standings
- Query params: `year`, `team`, `sort_by`, `order`
- Returns: Paginated list of QB seasons with ELO rankings
- Response format:
```json
{
  "standings": [
    { "rank": 1, "name": "...", "year": 2020, "team": "...", "elo": 1850, "stats": {...} }
  ],
  "total": 500
}
```

## ELO Algorithm Details
- Initial seeding: Based on passer rating (e.g., `initialELO = 1000 + (passerRating * 5)`)
- K-factor: 32 (standard chess value)
- Formula:
  - Expected score: `E_A = 1 / (1 + 10^((R_B - R_A)/400))`
  - New rating: `R_A_new = R_A + K * (S_A - E_A)`
  - Where S_A = 1 for win, 0 for loss
- No decay over time

## UI/UX Requirements
- **Side-by-side comparison**: Works on desktop and mobile
- **Mobile layout**: May stack vertically but maintain easy comparison
- **Smooth transitions**: After voting, animate reveal and transition to next matchup
- **Session persistence**: Use cookies/localStorage to track session ID
- **Avoid repeats**: Don't show same matchup twice in short period (track last ~20 matchups per session)

## Development Priorities
1. ✅ Project setup (Next.js + TypeScript + Tailwind)
2. ✅ Git repository initialization
3. 🔄 Database setup (Neon PostgreSQL)
4. Data ingestion (fetch from NFLverse, seed database)
5. ELO system implementation
6. Matchup API endpoint
7. Vote API endpoint
8. Frontend matchup component
9. Reveal animation
10. Standings page
11. Session management
12. Deployment to Vercel

## Environment Variables (To be configured)
```
DATABASE_URL=postgresql://...@...neon.tech/...
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or production URL)
```

## Notes
- Start simple: Get basic matchup → vote → reveal flow working first
- Optimize later: Advanced matchup algorithm (e.g., pairing similar ELOs) can come later
- Mobile-first: Ensure UI works well on phones since this is a casual comparison app
- Performance: Consider caching standings, pre-computing matchup pairs
- Future enhancements: User accounts, personal rankings, filters, advanced stats, playoff data
