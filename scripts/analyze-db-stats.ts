import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

function calculateStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const p90 = sorted[Math.floor(sorted.length * 0.90)];
  const p10 = sorted[Math.floor(sorted.length * 0.10)];

  return {
    mean,
    median,
    std,
    p10,
    p25,
    p75,
    p90,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    iqr: p75 - p25
  };
}

async function main() {
  // Get all QB seasons from database
  const seasons = await prisma.qBSeason.findMany({
    select: {
      completions: true,
      passAttempts: true,
      passingYards: true,
      touchdowns: true,
      interceptions: true,
      passerRating: true,
      sacks: true,
      fumbles: true,
      rushYards: true,
      rushTouchdowns: true,
    }
  });

  console.log(`Analyzing ${seasons.length} QB seasons from database\n`);

  // Calculate derived stats
  const stats = {
    completionPct: seasons.map(s => (s.completions / s.passAttempts) * 100),
    passingYards: seasons.map(s => s.passingYards),
    passYPA: seasons.map(s => s.passingYards / s.passAttempts),
    passTD: seasons.map(s => s.touchdowns),
    interceptions: seasons.map(s => s.interceptions),
    passerRating: seasons.map(s => parseFloat(s.passerRating.toString())),
    sacks: seasons.map(s => s.sacks),
    fumbles: seasons.map(s => s.fumbles),
    rushYards: seasons.map(s => s.rushYards),
    rushTD: seasons.map(s => s.rushTouchdowns),
  };

  console.log('Statistical Analysis of QB Seasons in Database:');
  console.log('='.repeat(80));

  Object.entries(stats).forEach(([statName, values]) => {
    const analysis = calculateStats(values);

    console.log(`\n${statName}:`);
    console.log(`  Count: ${values.length}`);
    console.log(`  Mean: ${analysis.mean.toFixed(2)}`);
    console.log(`  Median: ${analysis.median.toFixed(2)}`);
    console.log(`  Std Dev: ${analysis.std.toFixed(2)}`);
    console.log(`  Range: ${analysis.min.toFixed(2)} - ${analysis.max.toFixed(2)}`);
    console.log(`  P10-P90: ${analysis.p10.toFixed(2)} - ${analysis.p90.toFixed(2)}`);
    console.log(`  IQR (P25-P75): ${analysis.p25.toFixed(2)} - ${analysis.p75.toFixed(2)}`);
    console.log(`  IQR Width: ${analysis.iqr.toFixed(2)}`);

    // Suggested thresholds
    const halfStd = analysis.std * 0.5;
    const quarterIqr = analysis.iqr * 0.25;
    const thirdIqr = analysis.iqr * 0.33;

    console.log(`\n  Threshold options:`);
    console.log(`    0.5 std dev: ${halfStd.toFixed(2)} (${(halfStd / analysis.mean * 100).toFixed(1)}% of mean)`);
    console.log(`    0.25 IQR: ${quarterIqr.toFixed(2)} (${(quarterIqr / analysis.mean * 100).toFixed(1)}% of mean)`);
    console.log(`    0.33 IQR: ${thirdIqr.toFixed(2)} (${(thirdIqr / analysis.mean * 100).toFixed(1)}% of mean)`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
