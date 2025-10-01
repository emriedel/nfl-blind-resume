# QB Blind Resume

A web application for comparing NFL quarterback seasons without bias. Users vote on which QB season is better based purely on stats, then discover whose seasons they preferred through an ELO-based ranking system.

## Features

- **Blind Comparisons**: View QB season stats side-by-side without knowing player identities
- **ELO Rankings**: Global rankings based on crowd-sourced voting
- **Reveal Animation**: Discover player identities after voting
- **Standings Page**: Browse all QB seasons ranked by ELO with filtering options
- **Session Tracking**: Avoid repeated matchups within your session

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel
- **Data Source**: NFLverse

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nfl-blind-resume
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials:
```
DATABASE_URL=postgresql://user:password@host/database
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Seed the database with QB data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
├── app/                  # Next.js app router pages
│   ├── api/             # API routes
│   ├── matchup/         # Matchup comparison page
│   ├── standings/       # Rankings/leaderboard page
│   └── layout.tsx       # Root layout
├── components/          # React components
├── lib/                 # Utility functions
│   ├── db/             # Database queries and schema
│   ├── elo.ts          # ELO rating calculations
│   └── nflverse.ts     # NFLverse data fetching
├── public/             # Static assets
└── types/              # TypeScript type definitions
```

## Data

QB season data is sourced from [NFLverse](https://github.com/nflverse), filtered to include only:
- Regular season games
- Minimum 8 games played
- Minimum 200 pass attempts

## ELO System

- **Initial Rating**: Seeded based on passer rating
- **K-factor**: 32 (standard chess value)
- **Updates**: After each user vote
- **No Decay**: Ratings remain stable over time

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management

- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with QB data
- `npm run db:reset` - Reset database (caution!)

## Deployment

This app is designed to be deployed on [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT

## Acknowledgments

- Data provided by [NFLverse](https://github.com/nflverse)
- Inspired by various "blind resume" comparison applications
