// Script to analyze QB stats and determine significant difference thresholds
const https = require('https');

async function fetchData() {
  return new Promise((resolve, reject) => {
    https.get('https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.csv', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row);
  }

  return rows;
}

function calculateStats(values) {
  const sorted = values.sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const p90 = sorted[Math.floor(sorted.length * 0.90)];
  const p10 = sorted[Math.floor(sorted.length * 0.10)];

  return { mean, median, std, p10, p25, p75, p90, min: sorted[0], max: sorted[sorted.length - 1] };
}

async function main() {
  console.log('Fetching data...');
  const csv = await fetchData();
  const data = parseCSV(csv);

  // Filter for qualifying QB seasons (same as your app logic)
  const qbSeasons = data.filter(row => {
    return row.position === 'QB' &&
           row.season_type === 'REG' &&
           parseInt(row.games || 0) >= 12 &&
           parseInt(row.attempts || 0) >= 300;
  });

  console.log(`Found ${qbSeasons.length} qualifying QB seasons\n`);

  // Stats to analyze
  const stats = {
    'completionPct': qbSeasons.map(s => parseFloat(s.completions || 0) / parseFloat(s.attempts || 1) * 100).filter(v => !isNaN(v)),
    'passingYards': qbSeasons.map(s => parseInt(s.passing_yards || 0)).filter(v => !isNaN(v)),
    'passYPA': qbSeasons.map(s => parseFloat(s.passing_yards || 0) / parseFloat(s.attempts || 1)).filter(v => !isNaN(v)),
    'passTD': qbSeasons.map(s => parseInt(s.passing_tds || 0)).filter(v => !isNaN(v)),
    'interceptions': qbSeasons.map(s => parseInt(s.interceptions || 0)).filter(v => !isNaN(v)),
    'passerRating': qbSeasons.map(s => parseFloat(s.passing_epa || 0)).filter(v => !isNaN(v)), // Using EPA as proxy
    'sacks': qbSeasons.map(s => parseInt(s.sacks || 0)).filter(v => !isNaN(v)),
    'fumbles': qbSeasons.map(s => parseInt(s.sack_fumbles_lost || 0)).filter(v => !isNaN(v)),
    'rushYards': qbSeasons.map(s => parseInt(s.rushing_yards || 0)).filter(v => !isNaN(v)),
    'rushTD': qbSeasons.map(s => parseInt(s.rushing_tds || 0)).filter(v => !isNaN(v)),
  };

  console.log('Statistical Analysis of Qualifying QB Seasons:');
  console.log('='.repeat(80));

  Object.entries(stats).forEach(([stat, values]) => {
    const analysis = calculateStats(values);
    const range = analysis.p75 - analysis.p25; // IQR

    console.log(`\n${stat}:`);
    console.log(`  Mean: ${analysis.mean.toFixed(2)}`);
    console.log(`  Median: ${analysis.median.toFixed(2)}`);
    console.log(`  Std Dev: ${analysis.std.toFixed(2)}`);
    console.log(`  Range: ${analysis.min.toFixed(2)} - ${analysis.max.toFixed(2)}`);
    console.log(`  P10-P90: ${analysis.p10.toFixed(2)} - ${analysis.p90.toFixed(2)}`);
    console.log(`  IQR (P25-P75): ${analysis.p25.toFixed(2)} - ${analysis.p75.toFixed(2)}`);
    console.log(`  IQR Width: ${range.toFixed(2)}`);

    // Suggested threshold: 0.5 standard deviations
    const suggestedThreshold = analysis.std * 0.5;
    console.log(`  Suggested threshold (0.5 std): ${suggestedThreshold.toFixed(2)}`);
  });
}

main().catch(console.error);
