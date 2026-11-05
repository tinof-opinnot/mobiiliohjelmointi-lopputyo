// Ajoreitti OSRM-reitityspalvelusta (avoin, ei vaadi API-avainta)

const BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
const NOT_FOUND = 'Reittiä tallille ei löytynyt.';

// Palauttaa { coordinates: [{ latitude, longitude }], distanceKm, durationMin }
export async function getDrivingRoute(from, to) {
  const points = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  let data = null;
  try {
    const response = await fetch(`${BASE_URL}/${points}?overview=full&geometries=geojson`);
    // Virhesivu voi olla HTML:ää, joten JSON luetaan vasta onnistuneesta vastauksesta
    if (response.ok) data = await response.json();
  } catch {
    throw new Error('Reitin haku epäonnistui. Tarkista verkkoyhteys.');
  }

  if (data?.code !== 'Ok' || !data.routes?.length) {
    throw new Error(NOT_FOUND);
  }

  const route = data.routes[0];
  return {
    // GeoJSON-koordinaatit ovat järjestyksessä [pituusaste, leveysaste]
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
    distanceKm: Math.round(route.distance / 100) / 10,
    durationMin: Math.round(route.duration / 60),
  };
}
