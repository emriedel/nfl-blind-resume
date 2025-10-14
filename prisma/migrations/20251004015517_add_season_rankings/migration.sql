-- AlterTable
ALTER TABLE "qb_seasons" ADD COLUMN     "completion_pct_rank" INTEGER,
ADD COLUMN     "interceptions_rank" INTEGER,
ADD COLUMN     "passer_rating_rank" INTEGER,
ADD COLUMN     "passing_yards_rank" INTEGER,
ADD COLUMN     "rush_touchdowns_rank" INTEGER,
ADD COLUMN     "rush_yards_rank" INTEGER,
ADD COLUMN     "touchdowns_rank" INTEGER;
