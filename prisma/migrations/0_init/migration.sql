-- CreateTable
CREATE TABLE "qb_seasons" (
    "id" SERIAL NOT NULL,
    "player_name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "games_played" INTEGER NOT NULL,
    "pass_attempts" INTEGER NOT NULL,
    "completions" INTEGER NOT NULL,
    "passing_yards" INTEGER NOT NULL,
    "touchdowns" INTEGER NOT NULL,
    "interceptions" INTEGER NOT NULL,
    "passer_rating" DECIMAL(5,2) NOT NULL,
    "wins" INTEGER,
    "losses" INTEGER,
    "rush_attempts" INTEGER NOT NULL DEFAULT 0,
    "rush_yards" INTEGER NOT NULL DEFAULT 0,
    "rush_touchdowns" INTEGER NOT NULL DEFAULT 0,
    "sacks" INTEGER NOT NULL DEFAULT 0,
    "fumbles" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qb_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elo_ratings" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "elo_score" DECIMAL(8,2) NOT NULL DEFAULT 1500,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elo_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "session_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" SERIAL NOT NULL,
    "session_id" UUID NOT NULL,
    "winner_season_id" INTEGER NOT NULL,
    "loser_season_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchup_history" (
    "id" SERIAL NOT NULL,
    "session_id" UUID NOT NULL,
    "season_a_id" INTEGER NOT NULL,
    "season_b_id" INTEGER NOT NULL,
    "shown_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matchup_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "elo_ratings_season_id_key" ON "elo_ratings"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_id_key" ON "user_sessions"("session_id");

-- AddForeignKey
ALTER TABLE "elo_ratings" ADD CONSTRAINT "elo_ratings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "qb_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_winner_season_id_fkey" FOREIGN KEY ("winner_season_id") REFERENCES "qb_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_loser_season_id_fkey" FOREIGN KEY ("loser_season_id") REFERENCES "qb_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_history" ADD CONSTRAINT "matchup_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_history" ADD CONSTRAINT "matchup_history_season_a_id_fkey" FOREIGN KEY ("season_a_id") REFERENCES "qb_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_history" ADD CONSTRAINT "matchup_history_season_b_id_fkey" FOREIGN KEY ("season_b_id") REFERENCES "qb_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

