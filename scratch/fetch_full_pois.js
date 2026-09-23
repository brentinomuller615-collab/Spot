const queries = ['restaurant', 'cafe', 'bakery', 'supermarket', 'shop', 'shopping mall', 'fuel', 'pharmacy'];
const apiKey = 'sCzNuUkpo4Iv4ck1leLa';

async function run() {
  const results = {};
  for (const q of queries) {
    const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?proximity=18.8602,-33.9321&types=poi&limit=10&key=${apiKey}`);
    const data = await res.json();
    results[q] = data.features;
  }
  require('fs').writeFileSync('scratch/pois_full.json', JSON.stringify(results, null, 2));
}

run();
