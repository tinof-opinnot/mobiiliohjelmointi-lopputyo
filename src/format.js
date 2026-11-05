// Päivämäärien ja lukujen muotoilu. Päivämäärät tallennetaan muodossa "2026-11-20".

const WEEKDAYS = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'];

const pad = (n) => String(n).padStart(2, '0');

export function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromIsoDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// "2026-11-20" + "10:00" -> Date paikallista aikaa
export function toDateTime(iso, time) {
  const date = fromIsoDate(iso);
  const [h, min] = time.split(':').map(Number);
  date.setHours(h, min, 0, 0);
  return date;
}

export function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function formatDate(iso) {
  const date = fromIsoDate(iso);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

export function formatShortDate(iso) {
  const date = fromIsoDate(iso);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.`;
}

export function formatDateTime(date) {
  return `${date.getDate()}.${date.getMonth() + 1}. klo ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function formatPrice(eur) {
  return `${eur} €`;
}
