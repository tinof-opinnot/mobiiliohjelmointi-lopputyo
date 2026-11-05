// Tallin sijainti ja retkien vaikeustasot

export const STABLE = {
  name: 'Pony Club -talli',
  address: 'Nuuksiontie 84, Espoo',
  latitude: 60.2937,
  longitude: 24.5627,
};

export const LEVELS = {
  beginner: { label: 'Aloittelija', color: '#4E8A5B' },
  intermediate: { label: 'Keskitaso', color: '#C78A2C' },
  advanced: { label: 'Kokenut', color: '#B04A3A' },
};

// Yhden varauksen suurin henkilömäärä
export const MAX_PERSONS = 6;

// Montako päivää eteenpäin retkiä voi varata
export const BOOKING_DAYS_AHEAD = 60;
