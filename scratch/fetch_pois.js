const apiKey = 'sCzNuUkpo4Iv4ck1leLa';
const center = [18.8602, -33.9321]; // lon, lat
const queries = ['restaurant', 'cafe', 'bakery', 'supermarket', 'shop', 'mall', 'fuel', 'pharmacy'];

async function fetchPOIs() {
  const results = {};
  for (const query of queries) {
    const url = `https://api.maptiler.com/geocoding/${query}.json?proximity=${center[0]},${center[1]}&key=${apiKey}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      results[query] = data.features;
    } catch (e) {
      console.error(e);
    }
  }
  console.log(JSON.stringify(results, null, 2));
}
fetchPOIs();
