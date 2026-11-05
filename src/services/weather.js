// Sääennuste Open-Meteo-rajapinnasta (ei vaadi API-avainta).
// Päiväennuste, tuntiennuste retken ajalle, auringonlasku ja varoitukset.

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_MS = 10 * 60 * 1000;

// WMO-säätila: teksti ja MaterialCommunityIcons-kuvake
const WEATHER_CODES = {
  0: ['Selkeää', 'weather-sunny'],
  1: ['Enimmäkseen selkeää', 'weather-partly-cloudy'],
  2: ['Puolipilvistä', 'weather-partly-cloudy'],
  3: ['Pilvistä', 'weather-cloudy'],
  45: ['Sumua', 'weather-fog'],
  48: ['Huurtavaa sumua', 'weather-fog'],
  51: ['Heikkoa tihkusadetta', 'weather-rainy'],
  53: ['Tihkusadetta', 'weather-rainy'],
  55: ['Runsasta tihkusadetta', 'weather-rainy'],
  56: ['Jäätävää tihkua', 'weather-snowy-rainy'],
  57: ['Jäätävää tihkua', 'weather-snowy-rainy'],
  61: ['Heikkoa sadetta', 'weather-rainy'],
  63: ['Sadetta', 'weather-rainy'],
  65: ['Runsasta sadetta', 'weather-pouring'],
  66: ['Jäätävää sadetta', 'weather-snowy-rainy'],
  67: ['Jäätävää sadetta', 'weather-snowy-rainy'],
  71: ['Heikkoa lumisadetta', 'weather-snowy'],
  73: ['Lumisadetta', 'weather-snowy'],
  75: ['Runsasta lumisadetta', 'weather-snowy-heavy'],
  77: ['Lumijyväsiä', 'weather-snowy'],
  80: ['Sadekuuroja', 'weather-rainy'],
  81: ['Sadekuuroja', 'weather-pouring'],
  82: ['Rankkoja sadekuuroja', 'weather-pouring'],
  85: ['Lumikuuroja', 'weather-snowy'],
  86: ['Runsaita lumikuuroja', 'weather-snowy-heavy'],
  95: ['Ukkosta', 'weather-lightning'],
  96: ['Ukkosta ja raetta', 'weather-hail'],
  99: ['Ukkosta ja raetta', 'weather-hail'],
};

function describe(code) {
  const [description, icon] = WEATHER_CODES[code] ?? ['Ei tietoa', 'weather-cloudy-alert'];
  return { description, icon };
}

// "2026-11-20T15:31" -> minuutit keskiyöstä
const minutesOfDay = (isoTime) => {
  const [h, m] = isoTime.slice(11, 16).split(':').map(Number);
  return h * 60 + m;
};
const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
const pad = (n) => String(n).padStart(2, '0');

const cache = {};

// Palauttaa { days: [...], hours: { "2026-11-20T10:00": {...} } }
export async function getForecast(latitude, longitude) {
  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  if (cache[key] && Date.now() - cache[key].time < CACHE_MS) return cache[key].data;

  const params = [
    `latitude=${latitude}`,
    `longitude=${longitude}`,
    'daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset',
    'hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m',
    'wind_speed_unit=ms',
    'timezone=Europe%2FHelsinki',
    'forecast_days=16',
  ].join('&');

  const response = await fetch(`${BASE_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Säätietojen haku epäonnistui (${response.status})`);
  }
  const { daily, hourly } = await response.json();

  // Ennusteen viimeisiltä päiviltä osa arvoista voi puuttua (null). Puutteelliset
  // päivät ohitetaan ennen pyöristystä, koska Math.round(null) olisi 0.
  const isComplete = (i) =>
    [daily.weather_code, daily.temperature_2m_max, daily.temperature_2m_min, daily.sunrise, daily.sunset].every(
      (values) => values[i] != null
    );
  const days = daily.time
    .map((date, i) => ({ date, i }))
    .filter(({ i }) => isComplete(i))
    .map(({ date, i }) => ({
      date,
      ...describe(daily.weather_code[i]),
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      precipitation: daily.precipitation_sum[i] ?? 0,
      wind: Math.round(daily.wind_speed_10m_max[i] ?? 0),
      sunrise: daily.sunrise[i].slice(11, 16),
      sunset: daily.sunset[i].slice(11, 16),
      sunriseMinutes: minutesOfDay(daily.sunrise[i]),
      sunsetMinutes: minutesOfDay(daily.sunset[i]),
    }));

  const hours = {};
  hourly.time.forEach((time, i) => {
    if (hourly.weather_code[i] == null || hourly.temperature_2m[i] == null) return;
    hours[time] = {
      code: hourly.weather_code[i],
      temp: hourly.temperature_2m[i],
      precipProb: hourly.precipitation_probability[i] ?? 0,
      wind: hourly.wind_speed_10m[i] ?? 0,
      gusts: hourly.wind_gusts_10m[i] ?? 0,
    };
  });

  const data = { days, hours };
  cache[key] = { time: Date.now(), data };
  return data;
}

// Ukkosen ja raekuurojen koodit
const STORM_CODES = [95, 96, 99];

// Retken ajan sää: alkuhetken tiedot, koko retken pahimmat arvot ja varoitukset
export function getRideWeather(forecast, date, time, durationMin) {
  const day = forecast.days.find((d) => d.date === date);
  if (!day) return null;

  const start = timeToMinutes(time);
  const end = start + durationMin;
  const slotHours = [];
  for (let h = Math.floor(start / 60); h * 60 < end; h++) {
    const hour = forecast.hours[`${date}T${pad(h)}:00`];
    if (hour) slotHours.push(hour);
  }
  if (slotHours.length === 0) return null;

  const first = slotHours[0];
  const maxPrecipProb = Math.max(...slotHours.map((h) => h.precipProb));
  const maxGusts = Math.round(Math.max(...slotHours.map((h) => h.gusts)));
  const minTemp = Math.round(Math.min(...slotHours.map((h) => h.temp)));
  const maxTemp = Math.round(Math.max(...slotHours.map((h) => h.temp)));
  const storm = slotHours.some((h) => STORM_CODES.includes(h.code));

  const warnings = [];
  if (storm) warnings.push('Ukkosta ennustettu. Talli voi perua retken.');
  if (maxGusts >= 15) warnings.push(`Kovia tuulenpuuskia, jopa ${maxGusts} m/s.`);
  if (maxPrecipProb >= 70) warnings.push(`Sateen todennäköisyys ${maxPrecipProb} %. Ota sadevarusteet.`);
  if (minTemp <= -15) warnings.push(`Kova pakkanen (${minTemp} °C). Pukeudu lämpimästi.`);
  if (maxTemp >= 27) warnings.push(`Helle (${maxTemp} °C). Ota juotavaa mukaan.`);
  // Pimeä: talvella aamun lähdöt voivat olla ennen auringonnousua
  if (start >= day.sunsetMinutes) {
    warnings.push(`Retki alkaa auringonlaskun (klo ${day.sunset}) jälkeen. Heijastinliivi on pakollinen.`);
  } else if (end > day.sunsetMinutes) {
    warnings.push(`Retki päättyy auringonlaskun (klo ${day.sunset}) jälkeen. Heijastinliivi on pakollinen.`);
  } else if (start < day.sunriseMinutes) {
    warnings.push(`Retki alkaa ennen auringonnousua (klo ${day.sunrise}). Heijastinliivi on pakollinen.`);
  }

  return {
    ...describe(first.code),
    temp: Math.round(first.temp),
    maxPrecipProb,
    maxGusts,
    sunset: day.sunset,
    warnings,
  };
}
